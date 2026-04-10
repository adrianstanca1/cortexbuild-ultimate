/**
 * server/lib/rag-trigger.js
 * Lightweight hooks called by generic.js after CRUD operations.
 * Queues async embedding updates without blocking the HTTP response.
 *
 * Usage in generic.js — after INSERT/UPDATE/DELETE:
 *   require('../lib/rag-trigger').queueEmbedding(tableName, row, req.user, 'create');
 */
const { embedEntity } = require('./rag-embed');
const { SEARCHABLE_TABLES } = require('./rag-manifest');

// Fire-and-forget — errors are logged but never block the caller
function queueEmbedding(tableName, row, user, action) {
  if (!SEARCHABLE_TABLES.includes(tableName)) return;

  // company_owner users have organization_id = NULL but a valid company_id.
  // Use company_id as a fallback so RAG embeddings are stored and queryable
  // for all tenant types — consistent with rag.js tenantFilter and ai-predictive.js.
  const orgId = user?.organization_id || user?.company_id;
  if (!orgId) return;

  // Async — don't await
  setImmediate(async () => {
    try {
      if (action === 'delete') {
        // Delete the embedding
        const pool = require('../db');
        await pool.query(
          `DELETE FROM rag_embeddings WHERE organization_id = $1 AND table_name = $2 AND row_id = $3`,
          [orgId, tableName, row.id]
        );
      } else {
        await embedEntity(tableName, row, orgId);
      }
    } catch (e) {
      console.error(`[rag-trigger] ${action}/${tableName}/${row?.id}: ${e.message}`);
    }
  });
}

module.exports = { queueEmbedding };
