const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const https = require('https');
const http = require('http');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'qwen3.5:latest';

// Cosine similarity helper
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

// Fetch embedding from Ollama
async function getEmbedding(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: EMBEDDING_MODEL, prompt: text });
    const url = new URL(OLLAMA_HOST + '/api/embeddings');
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 11434),
      path: '/api/embeddings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.embedding || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

const router = express.Router();
router.use(authMiddleware);

const SEARCHABLE_TABLES = [
  'projects',
  'invoices',
  'safety_incidents',
  'rfis',
  'change_orders',
  'team_members',
  'documents',
  'subcontractors',
  'contacts',
  'tenders',
  'rams',
  'meetings',
  'daily_reports',
];

router.get('/', async (req, res) => {
  try {
    const { q, limit = '20' } = req.query;
    if (!q || q.length < 2) {
      return res.json({
        results: { projects: [], invoices: [], contacts: [], rfis: [], documents: [], team: [] },
        total: 0,
        query: q || '',
        semanticResults: [],
        searchMode: 'text',
      });
    }

    const searchTerm = `%${q.toLowerCase().replace(/[%_\\]/g, '\\$&')}%`;
    const results = { projects: [], invoices: [], contacts: [], rfis: [], documents: [], team: [] };
    const limitNum = parseInt(limit, 10);
    const role = req.user?.role;
    const tenantCol = role === 'company_owner' ? 'company_id' : 'organization_id';
    const tenantId = role === 'company_owner' ? req.user?.company_id : req.user?.organization_id;

    const projectResults = await pool.query(
      `SELECT id, name, client, status, type FROM projects
       WHERE ${tenantCol} = $1 AND (LOWER(name) LIKE $2 OR LOWER(client) LIKE $2)
       ORDER BY created_at DESC LIMIT $3`,
      [tenantId, searchTerm, limitNum]
    );
    results.projects = projectResults.rows;

    const invoiceResults = await pool.query(
      `SELECT id, number, client, amount, status FROM invoices
       WHERE ${tenantCol} = $1 AND (LOWER(number) LIKE $2 OR LOWER(client) LIKE $2)
       ORDER BY created_at DESC LIMIT $3`,
      [tenantId, searchTerm, limitNum]
    );
    results.invoices = invoiceResults.rows;

    const contactResults = await pool.query(
      `SELECT id, name, company, email, role FROM contacts
       WHERE ${tenantCol} = $1 AND (LOWER(name) LIKE $2 OR LOWER(company) LIKE $2 OR LOWER(email) LIKE $2)
       ORDER BY created_at DESC LIMIT $3`,
      [tenantId, searchTerm, limitNum]
    );
    results.contacts = contactResults.rows;

    const rfiResults = await pool.query(
      `SELECT id, number, subject, status, project FROM rfis
       WHERE ${tenantCol} = $1 AND (LOWER(number) LIKE $2 OR LOWER(subject) LIKE $2)
       ORDER BY created_at DESC LIMIT $3`,
      [tenantId, searchTerm, limitNum]
    );
    results.rfis = rfiResults.rows;

    const docResults = await pool.query(
      `SELECT id, name, type, category, project FROM documents
       WHERE ${tenantCol} = $1 AND (LOWER(name) LIKE $2 OR LOWER(category) LIKE $2)
       ORDER BY created_at DESC LIMIT $3`,
      [tenantId, searchTerm, limitNum]
    );
    results.documents = docResults.rows;

    const teamResults = await pool.query(
      `SELECT id, name, role, trade FROM team_members
       WHERE ${tenantCol} = $1 AND (LOWER(name) LIKE $2 OR LOWER(role) LIKE $2 OR LOWER(trade) LIKE $2)
       ORDER BY created_at DESC LIMIT $3`,
      [tenantId, searchTerm, limitNum]
    );
    results.team = teamResults.rows;

    const totalResults = Object.values(results).flat().length;

    // ── Semantic search with Ollama ────────────────────────────────────────
    let semanticResults = [];
    const doSemantic = req.query.semantic !== 'false' && q && q.length >= 2;
    if (doSemantic) {
      try {
        const queryEmbedding = await getEmbedding(q);
        if (queryEmbedding) {
          // Try to fetch stored embeddings and compute cosine similarity
          const { rows: chunks } = await pool.query(
            `SELECT de.chunk_text, de.embedding_vector, de.file_id, d.name as file_name, d.type
             FROM document_embeddings de
             JOIN documents d ON d.id = de.file_id
             WHERE COALESCE(d.organization_id, d.company_id) = $1
             LIMIT 200`,
            [tenantId]
          );
          // Embeddings are stored as JSON arrays from Ollama
          const scored = chunks.map(row => {
            let emb = null;
            try { emb = JSON.parse(row.embedding_vector); } catch { /* skip */ }
            if (!emb || !Array.isArray(emb)) return null;
            return { ...row, score: cosineSimilarity(queryEmbedding, emb) };
          }).filter(Boolean);

          scored.sort((a, b) => b.score - a.score);
          semanticResults = scored.slice(0, 10).map(s => ({
            type: 'semantic',
            file_name: s.file_name,
            file_id: s.file_id,
            chunk_text: s.chunk_text,
            score: Math.round(s.score * 100) / 100,
            doc_type: s.type,
          }));
        }
      } catch (semErr) {
        console.warn('[Search] Semantic search skipped:', semErr.message);
      }
    }

    res.json({
      results,
      total: totalResults,
      query: q,
      semanticResults,
      searchMode: semanticResults.length ? 'hybrid' : 'text',
    });
  } catch (err) {
    console.error('[Global Search]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
