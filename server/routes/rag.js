/**
 * server/routes/rag.js
 * RAG retrieval endpoints: semantic search + context gathering.
 * GET /api/rag/search    — vector similarity search across all tables
 * GET /api/rag/context   — gather full context chunks for a set of row IDs
 */
const express   = require('express');
const pool      = require('../db');
const authMw    = require('../middleware/auth');
const { getEmbedding } = require('../lib/ollama');
const { manifest, SEARCHABLE_TABLES } = require('../lib/rag-manifest');

const router = express.Router();
router.use(authMw);

const SUPER_ADMIN_ROLES = new Set(['super_admin', 'company_owner']);

/** Determine tenant filter clause. */
function tenantFilter(req) {
  if (!req.user) return { filter: '', params: [] };
  if (SUPER_ADMIN_ROLES.has(req.user.role)) return { filter: '', params: [] };
  if (req.user.organization_id) {
    return { filter: 'WHERE organization_id = $1', params: [req.user.organization_id] };
  }
  return { filter: '', params: [] };
}

/** GET /api/rag/search
 * Query params:
 *   q          — search phrase (required)
 *   tables     — comma-separated table names to search (default: all SEARCHABLE_TABLES)
 *   limit      — max results per table (default 5, max 20)
 *   threshold  — minimum cosine similarity 0–1 (default 0.5)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, tables: tablesParam, limit: limitParam = '5', threshold: thresholdParam = '0.5' } = req.query;
    if (!q || q.length < 2) {
      return res.json({ results: [], total: 0, query: q || '', semantic: true });
    }

    const limit    = Math.min(20, Math.max(1, parseInt(limitParam, 10)));
    const threshold = Math.max(0, Math.min(1, parseFloat(thresholdParam)));

    // Determine which tables to search
    const tables = tablesParam
      ? tablesParam.split(',').filter(t => SEARCHABLE_TABLES.includes(t))
      : SEARCHABLE_TABLES;

    // Get query embedding
    const queryEmbedding = await getEmbedding(q);
    if (!queryEmbedding) {
      return res.status(502).json({ message: 'Embedding service unavailable' });
    }

    const { filter, params: filterParams } = tenantFilter(req);

    // Search each table, use pg_vector for similarity
    // For super_admin / no org filter: search across all orgs
    // Otherwise: filter by organization_id
    const allResults = [];

    for (const tableName of tables) {
      if (!manifest[tableName] || manifest[tableName].skip) continue;

      // Build per-table query
      const orgFilter = filter
        ? `${filter} AND organization_id = $1`  // already parameterized
        : 'WHERE organization_id = $1';

      // Use <-> (Euclidean distance) or <=> (cosine distance) operator from pg_vector
      // vector_cosine_ops supports <=> (cosine distance = 1 - cosine_similarity)
      const searchQuery = filter
        ? `SELECT id, row_id, chunk_text,
                  (embedding <=> $2) AS similarity,
                  updated_at
           FROM rag_embeddings
           WHERE organization_id = $1 AND table_name = $3
           ORDER BY embedding <=> $2
           LIMIT $4`
        : `SELECT id, row_id, chunk_text,
                  (embedding <=> $1) AS similarity,
                  updated_at
           FROM rag_embeddings
           WHERE table_name = $2
           ORDER BY embedding <=> $1
           LIMIT $3`;

      const queryParams = filter
        ? [filterParams[0], JSON.stringify(queryEmbedding), tableName, limit]
        : [JSON.stringify(queryEmbedding), tableName, limit];

      try {
        const { rows } = await pool.query(searchQuery, queryParams);
        const filtered = rows.filter(r => (1 - parseFloat(r.similarity)) >= threshold);

        if (filtered.length > 0) {
          allResults.push({
            table: tableName,
            matches: filtered.map(r => ({
              row_id:       r.row_id,
              chunk_text:   r.chunk_text,
              similarity:   Math.round((1 - parseFloat(r.similarity)) * 100) / 100,
              updated_at:   r.updated_at,
            })),
          });
        }
      } catch (vecErr) {
        // Fallback: if pg_vector op fails (e.g., dimension mismatch), skip table
        console.warn(`[rag/search] ${tableName}: ${vecErr.message}`);
      }
    }

    const total = allResults.reduce((s, t) => s + t.matches.length, 0);

    res.json({
      results:    allResults,
      total,
      query:      q,
      tables:     tables,
      semantic:   true,
      model:      'qwen3.5:latest',
    });
  } catch (err) {
    console.error('[rag/search]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/** GET /api/rag/context
 * Fetch full row data for a set of table+row_ids, for context injection.
 * Query params:
 *   items — comma-separated "tableName:rowId" pairs
 */
router.get('/context', async (req, res) => {
  try {
    const { items } = req.query;
    if (!items) return res.json({ context: [] });

    const pairs = items.split(',').map(s => s.trim()).filter(Boolean);
    if (!pairs.length) return res.json({ context: [] });

    const { filter, params: filterParams } = tenantFilter(req);
    const context = [];

    for (const pair of pairs) {
      const [tableName, rowId] = pair.split(':');
      if (!tableName || !rowId) continue;
      if (!manifest[tableName] || manifest[tableName].skip) continue;

      let query, params;
      if (filter) {
        query = `SELECT * FROM ${tableName} WHERE id = $2 AND ${filter.replace('WHERE', '')}`;
        params = [...filterParams.slice(1), rowId]; // remove $1 org_id, use row_id as $2
      } else {
        query = `SELECT * FROM ${tableName} WHERE id = $1`;
        params = [rowId];
      }

      try {
        const { rows } = await pool.query(query, params);
        if (rows[0]) {
          context.push({
            table: tableName,
            row_id: rowId,
            data: rows[0],
          });
        }
      } catch (e) {
        console.warn(`[rag/context] ${tableName}/${rowId}: ${e.message}`);
      }
    }

    res.json({ context });
  } catch (err) {
    console.error('[rag/context]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
