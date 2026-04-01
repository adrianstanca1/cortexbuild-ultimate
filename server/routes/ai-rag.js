/**
 * server/routes/ai-rag.js
 * RAG-augmented AI chat endpoint.
 * POST /api/rag-chat  — receives a question, retrieves relevant context, streams synthesis.
 *
 * Body: { question, history?: [{role, content}], tables?: string[] }
 */
const express  = require('express');
const pool      = require('../db');
const authMw   = require('../middleware/auth');
const https    = require('https');
const http     = require('http');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const LLM_MODEL   = process.env.LLM_MODEL  || process.env.OLLAMA_MODEL || 'qwen3.5:latest';

const router  = express.Router();
router.use(authMw);

const SUPER_ADMIN_ROLES = new Set(['super_admin', 'company_owner']);

function tenantFilter(req) {
  if (!req.user) return '';
  if (SUPER_ADMIN_ROLES.has(req.user.role)) return '';
  if (req.user.organization_id) return `organization_id = '${req.user.organization_id}'`;
  return '';
}

function buildContextPrompt(contextItems) {
  if (!contextItems || contextItems.length === 0) return '';
  let prompt = '\n\nRelevant context from your data:\n';
  for (const item of contextItems) {
    const entries = Object.entries(item.data)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${String(v)}`)
      .slice(0, 20)
      .join(' | ');
    prompt += `- [${item.table}] ${entries}\n`;
  }
  return prompt;
}

async function getEmbedding(text) {
  return new Promise(resolve => {
    const body = JSON.stringify({ model: process.env.EMBEDDING_MODEL || 'qwen3.5:latest', prompt: text });
    const url    = new URL(OLLAMA_HOST + '/api/embeddings');
    const isHttps = url.protocol === 'https:';
    const lib    = isHttps ? https : http;
    const port   = url.port || (isHttps ? 443 : 11434);

    const req = lib.request({
      hostname: url.hostname, port, path: '/api/embeddings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)?.embedding || null); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body); req.end();
  });
}

async function retrieveContext(question, tables, orgFilter) {
  const embedding = await getEmbedding(question);
  if (!embedding) return [];

  const context = [];

  for (const table of tables) {
    const orgParam  = orgFilter ? `AND ${orgFilter}` : '';
    const paramBase = orgFilter ? 3 : 2;

    const { rows } = await pool.query(
      `SELECT row_id, (embedding <=> $1) AS similarity
       FROM rag_embeddings
       WHERE table_name = $2 ${orgParam}
       ORDER BY embedding <=> $1
       LIMIT 5`,
      orgFilter
        ? [JSON.stringify(embedding), table]
        : [JSON.stringify(embedding), table]
    ).catch(() => ({ rows: [] }));

    for (const r of rows.slice(0, 3)) {
      const similarity = 1 - parseFloat(r.similarity);
      if (similarity < 0.5) continue;
      const { rows: dataRows } = await pool.query(
        `SELECT * FROM ${table} WHERE id = $1 ${orgParam} LIMIT 1`,
        [r.row_id]
      ).catch(() => ({ rows: [] }));
      if (dataRows[0]) context.push({ table, row_id: r.row_id, data: dataRows[0] });
    }
  }
  return context;
}

/** POST /api/rag-chat */
router.post('/', async (req, res) => {
  try {
    const { question, history = [], tables = [] } = req.body;
    if (!question || question.length < 2) {
      return res.status(400).json({ message: 'question is required (min 2 chars)' });
    }

    const orgFilter = tenantFilter(req);

    const contextItems = tables.length
      ? await retrieveContext(question, tables, orgFilter)
      : [];

    const systemPrompt = `You are a helpful construction management AI assistant. Answer questions using ONLY the provided context data. If the context doesn't contain enough information to answer, say so clearly. Be specific and reference actual values from the data.`;
    const contextPrompt = buildContextPrompt(contextItems);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user',   content: question + contextPrompt },
    ];

    const body = JSON.stringify({ model: LLM_MODEL, messages, stream: true });
    const url    = new URL(OLLAMA_HOST + '/api/chat');
    const isHttps = url.protocol === 'https:';
    const lib    = isHttps ? https : http;
    const port   = url.port || (isHttps ? 443 : 11434);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const ollamaReq = lib.request({
      hostname: url.hostname, port, path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (ollamaRes) => {
      ollamaRes.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) res.write(parsed.message.content);
          } catch { /* skip non-JSON */ }
        }
      });
      ollamaRes.on('end', () => res.end());
    });

    ollamaReq.on('error', e => { console.error('[ai-rag]', e.message); res.end(); });
    ollamaReq.write(body);
    ollamaReq.end();
  } catch (err) {
    console.error('[ai-rag]', err.message);
    if (!res.headersSent) res.status(500).json({ message: err.message });
    else res.end();
  }
});

module.exports = router;
