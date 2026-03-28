/**
 * POST /api/tenders/:id/ai-score
 * AI-powered tender scoring using Ollama.
 * Analyses tender attributes across 6 dimensions and returns scores + reasoning.
 *
 * Body (optional): full tender record { title, client, value, deadline, status,
 *                probability, type, location, notes }
 *                If not provided, fetches from DB using :id.
 */
const express = require('express');
const pool    = require('../db');
const https   = require('https');
const http    = require('http');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const LLM_MODEL   = process.env.LLM_MODEL   || 'qwen3.5:latest';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return 'N/A';
  return '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(String(dateStr));
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 3600 * 24));
}

function callOllama(messages, options = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 600,
        ...options,
      },
    });

    const url = new URL(OLLAMA_HOST + '/api/chat');
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 11434),
      path:     '/api/chat',
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout:  60000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(data);
          if (p.error) return reject(new Error(p.error));
          resolve(p.message?.content || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Ollama request timed out')); });
    req.write(body);
    req.end();
  });
}

// ─── Rule-based seed scores ───────────────────────────────────────────────────

/**
 * Generate rule-based seed scores for each dimension before AI refinement.
 */
function ruleBasedScores(tender) {
  const now       = Date.now();
  const deadline  = tender.deadline ? new Date(String(tender.deadline)).getTime() : null;
  const daysLeft  = deadline ? Math.ceil((deadline - now) / (1000 * 3600 * 24)) : null;
  const value     = Number(tender.value) || 0;
  const prob      = Number(tender.probability) || 50;

  // Client relationship (0-100): probability is a strong proxy
  let clientRel = Math.min(95, Math.max(15, prob + (daysLeft && daysLeft > 30 ? 10 : 0)));

  // Technical fit (0-100): infer from tender type + value
  let techFit = 60;
  if (/\bdesign\s*&\s*build\b|design\s*and\s*build\b/i.test(tender.type)) techFit += 15;
  if (/\btwo\s*stage\b/i.test(tender.type)) techFit += 10;
  if (/\bminor\s*works\b/i.test(tender.type)) techFit -= 10;
  if (value > 5_000_000) techFit += 10;   // large projects need strong fit
  if (value < 100_000)   techFit -= 10;   // small works = lower complexity bar
  techFit = Math.min(95, Math.max(10, techFit));

  // Price competitiveness (0-100): invert risk from value scale
  let priceComp = 65;
  if (value > 10_000_000) priceComp -= 15;  // big projects = tight margins risk
  else if (value > 1_000_000) priceComp += 5;
  else if (value < 250_000)    priceComp += 10; // small works often more competitive
  if (prob < 30)  priceComp -= 15;  // low probability may mean price is too high
  if (prob > 70)  priceComp += 10;
  priceComp = Math.min(95, Math.max(10, priceComp));

  // Programme risk (0-100, lower = less risk): deadline proximity is key
  let progRisk = 50;
  if (daysLeft !== null) {
    if (daysLeft < 0)       progRisk += 30;  // already past deadline
    else if (daysLeft < 7)  progRisk += 20;
    else if (daysLeft < 14) progRisk += 10;
    else if (daysLeft > 60) progRisk -= 15;  // comfortable time
  }
  if (tender.status === 'submitted') progRisk -= 10; // further along = less risk
  progRisk = Math.min(95, Math.max(5, progRisk));

  // Resource availability (0-100): status-based heuristic
  let resources = 60;
  if (tender.status === 'drafting')    resources += 10;
  if (tender.status === 'submitted')   resources += 5;
  if (tender.status === 'shortlisted') resources += 15;
  if (tender.status === 'won')          resources += 20;
  if (value > 5_000_000)              resources -= 15; // big projects strain resources
  resources = Math.min(95, Math.max(10, resources));

  return { clientRel, techFit, priceComp, progRisk, resources };
}

// ─── Main scoring handler ─────────────────────────────────────────────────────

router.post('/:id/ai-score', async (req, res) => {
  const { id } = req.params;
  const orgId  = req.user?.organization_id;
  const isSuper = ['super_admin', 'company_owner'].includes(req.user?.role);

  try {
    // ── 1. Resolve tender record ────────────────────────────────────────────
    let tender = req.body;
    if (!tender || Object.keys(tender).length === 0) {
      let whereClause = 'WHERE id = $1';
      let params = [id];
      if (orgId && !isSuper) {
        whereClause += ' AND organization_id = $2';
        params.push(orgId);
      }
      const { rows } = await pool.query(
        `SELECT title, client, value, deadline, status, probability, type, location, notes
         FROM tenders ${whereClause} LIMIT 1`,
        params
      );
      if (!rows.length) return res.status(404).json({ error: 'Tender not found' });
      tender = rows[0];
    }

    // ── 2. Build rule-based seed ────────────────────────────────────────────
    const seeds = ruleBasedScores(tender);
    const daysLeft = daysUntil(tender.deadline);

    // ── 3. Prompt Ollama for AI refinement + reasoning ──────────────────────
    const prompt = `You are a senior construction bid manager evaluating a tender opportunity.
Analyse the following tender and score it across 6 dimensions. Be rigorous and specific in your reasoning.

TENDER DETAILS:
- Title: ${tender.title || 'N/A'}
- Client: ${tender.client || 'N/A'}
- Value: ${fmt(tender.value)}
- Deadline: ${tender.deadline ? new Date(String(tender.deadline)).toLocaleDateString('en-GB') : 'Not specified'} (${daysLeft !== null ? (daysLeft >= 0 ? daysLeft + ' days remaining' : daysLeft + ' days overdue') : 'No deadline set'})
- Status: ${tender.status || 'drafting'}
- Win Probability: ${tender.probability ?? 'not specified'}%
- Type: ${tender.type || 'Not specified'}
- Location: ${tender.location || 'Not specified'}
- Notes: ${tender.notes || 'None'}

CURRENT SEED SCORES (before AI refinement):
- Client Relationship: ${seeds.clientRel}/100
- Technical Fit: ${seeds.techFit}/100
- Price Competitiveness: ${seeds.priceComp}/100
- Programme Risk: ${seeds.progRisk}/100 (lower = less risk)
- Resource Availability: ${seeds.resources}/100

YOUR TASK:
Return a JSON object (no markdown, no code fences) with the following exact structure:
{
  "overall": 0-100,
  "clientRel": 0-100,
  "techFit": 0-100,
  "priceComp": 0-100,
  "progRisk": 0-100,
  "resources": 0-100,
  "reasoning": "2-4 sentence explanation of the overall score and key scoring factors"
}

Scoring criteria:
- overall: Weighted composite (favoured dimensions: clientRel 30%, techFit 25%, priceComp 25%, progRisk 10%, resources 10%). Normalise to 0-100.
- clientRel: Client relationship strength. High win probability + known client + long deadline = high score.
- techFit: How well our capabilities match the project requirements. Design & Build, complex projects = higher fit bar needed.
- priceComp: Value for money perception. Competitive tender value, good margin potential = high.
- progRisk: Programme/delivery risk (inverted: low score = low risk). Short deadline, past deadline, complex scope = high risk.
- resources: Do we have capacity and capability? Shortlisted = we can resource it. Large project = capacity concern.

Be honest. Do not inflate scores.`;

    let rawResponse = '';
    try {
      rawResponse = await callOllama([
        { role: 'user', content: prompt }
      ]);
    } catch (ollamaErr) {
      console.warn('[tender-ai] Ollama unavailable, using rule-based fallback:', ollamaErr.message);
      // Fall back to rule-based only
      const overall = Math.round(
        seeds.clientRel  * 0.30 +
        seeds.techFit    * 0.25 +
        seeds.priceComp  * 0.25 +
        (100 - seeds.progRisk) * 0.10 +
        seeds.resources  * 0.10
      );
      return res.json({
        overall:    Math.min(95, Math.max(5, overall)),
        clientRel:  seeds.clientRel,
        techFit:    seeds.techFit,
        priceComp:  seeds.priceComp,
        progRisk:   seeds.progRisk,
        resources:  seeds.resources,
        reasoning:  `Rule-based scoring (Ollama unavailable): deadline ${daysLeft !== null ? (daysLeft >= 0 ? 'in ' + daysLeft + ' days' : daysLeft + ' days ago') : 'unknown'}, value ${fmt(tender.value)}, probability ${tender.probability ?? '?'}%, type ${tender.type || 'standard'}.`,
        source:     'rule-based',
      });
    }

    // ── 4. Parse JSON response ───────────────────────────────────────────────
    let scores;
    try {
      // Strip any markdown fences or trailing text
      const jsonStr = rawResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      // Find first { and last }
      const start = jsonStr.indexOf('{');
      const end   = jsonStr.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON object found');
      scores = JSON.parse(jsonStr.slice(start, end + 1));
    } catch (parseErr) {
      console.warn('[tender-ai] Failed to parse Ollama response, using seeds:', parseErr.message);
      const overall = Math.round(
        seeds.clientRel  * 0.30 +
        seeds.techFit    * 0.25 +
        seeds.priceComp  * 0.25 +
        (100 - seeds.progRisk) * 0.10 +
        seeds.resources  * 0.10
      );
      return res.json({
        overall:    Math.min(95, Math.max(5, overall)),
        clientRel:  seeds.clientRel,
        techFit:    seeds.techFit,
        priceComp:  seeds.priceComp,
        progRisk:   seeds.progRisk,
        resources:  seeds.resources,
        reasoning:  rawResponse.substring(0, 300) || 'Scoring completed with fallback.',
        source:     'rule-based',
      });
    }

    // ── 5. Validate and clamp scores ────────────────────────────────────────
    const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(Number(v) || 50)));

    const overall    = clamp(scores.overall, 5, 95);
    const clientRel  = clamp(scores.clientRel);
    const techFit    = clamp(scores.techFit);
    const priceComp  = clamp(scores.priceComp);
    const progRisk   = clamp(scores.progRisk, 5, 95);
    const resources  = clamp(scores.resources);
    const reasoning  = String(scores.reasoning || '').substring(0, 500);

    // ── 6. Optionally persist the overall score to DB ─────────────────────────
    try {
      let updateQuery = 'UPDATE tenders SET ai_score = $1, updated_at = NOW() WHERE id = $2';
      let updateParams = [overall, id];
      if (orgId && !isSuper) {
        updateQuery += ' AND organization_id = $3';
        updateParams.push(orgId);
      }
      await pool.query(updateQuery, updateParams);
    } catch (dbErr) {
      console.warn('[tender-ai] Could not persist ai_score:', dbErr.message);
    }

    res.json({
      overall,
      clientRel,
      techFit,
      priceComp,
      progRisk,
      resources,
      reasoning,
      source: 'ollama',
    });
  } catch (err) {
    console.error('[tender-ai] Scoring error:', err.message);
    res.status(500).json({ error: 'Scoring failed: ' + err.message });
  }
});

// ─── POST /ai-score/batch ─────────────────────────────────────────────────────
// Score multiple tenders at once
router.post('/batch/ai-score', async (req, res) => {
  const { tenderIds } = req.body;
  if (!Array.isArray(tenderIds) || !tenderIds.length) {
    return res.status(400).json({ error: 'tenderIds array required' });
  }
  if (tenderIds.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 tenders per batch' });
  }

  const orgId  = req.user?.organization_id;
  const isSuper = ['super_admin', 'company_owner'].includes(req.user?.role);
  const results = [];

  for (const id of tenderIds) {
    try {
      const { rows } = await pool.query(
        `SELECT title, client, value, deadline, status, probability, type, location, notes
         FROM tenders WHERE id = $1 ${orgId && !isSuper ? 'AND organization_id = $2' : ''} LIMIT 1`,
        orgId && !isSuper ? [id, orgId] : [id]
      );
      if (!rows.length) { results.push({ id, error: 'Not found' }); continue; }

      const tender = rows[0];
      const seeds  = ruleBasedScores(tender);

      // Run Ollama (single scoring, fast enough in loop for small batches)
      const daysLeft = daysUntil(tender.deadline);
      const prompt   = `Score this tender: title="${tender.title}", client="${tender.client}", value=${fmt(tender.value)}, deadline="${tender.deadline}", status="${tender.status}", probability="${tender.probability}", type="${tender.type}", location="${tender.location}". Return JSON only: {"overall":0-100,"clientRel":0-100,"techFit":0-100,"priceComp":0-100,"progRisk":0-100,"resources":0-100,"reasoning":"text"}.`;

      let overall;
      try {
        const raw = await callOllama([{ role: 'user', content: prompt }]);
        const start = raw.indexOf('{');
        const end   = raw.lastIndexOf('}');
        const parsed = JSON.parse(raw.slice(start, end + 1));
        overall = Math.min(95, Math.max(5, Math.round(Number(parsed.overall) || 50)));
      } catch {
        overall = Math.round(
          seeds.clientRel  * 0.30 +
          seeds.techFit    * 0.25 +
          seeds.priceComp  * 0.25 +
          (100 - seeds.progRisk) * 0.10 +
          seeds.resources  * 0.10
        );
      }

      await pool.query(
        `UPDATE tenders SET ai_score = $1, updated_at = NOW() WHERE id = $2 ${orgId && !isSuper ? 'AND organization_id = $3' : ''}`,
        orgId && !isSuper ? [overall, id, orgId] : [overall, id]
      );

      results.push({ id, overall });
    } catch (e) {
      results.push({ id, error: e.message });
    }
  }

  res.json({ results });
});

module.exports = router;
