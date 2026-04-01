/**
 * server/lib/rag-embed.js
 * Background worker that generates and stores vector embeddings for all tables.
 * Run on-demand or on a schedule:
 *   node -e "require('./lib/rag-embed').runFullEmbedding()"
 *
 * Staleness-checked: skips rows whose updated_at is older than the last embed.
 */
const pool     = require('../db');
const { getEmbedding, EMBEDDING_MODEL } = require('./ollama');
const { manifest, SEARCHABLE_TABLES }  = require('./rag-manifest');

const BATCH_SIZE = 20;  // rows per Ollama call batch

/**
 * Embed a single row: upsert into rag_embeddings.
 * Returns null on failure, the embedding vector on success.
 */
async function embedRow(orgId, tableName, row, client) {
  const entry = manifest[tableName];
  if (!entry || entry.skip) return null;

  const text    = entry.textify(row);
  const rowId   = row.id;
  if (!text || !rowId) return null;

  const embedding = await getEmbedding(text);
  if (!embedding) return null;

  await client.query(
    `INSERT INTO rag_embeddings (organization_id, table_name, row_id, chunk_text, embedding, embedding_model, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (organization_id, table_name, row_id)
     DO UPDATE SET chunk_text = EXCLUDED.chunk_text,
                    embedding  = EXCLUDED.embedding,
                    embedding_model = EXCLUDED.embedding_model,
                    updated_at = NOW()`,
    [orgId, tableName, rowId, text, JSON.stringify(embedding), EMBEDDING_MODEL]
  );
  return embedding;
}

/**
 * Run full embedding for a given table and org (or all orgs if orgId is null).
 * Returns { table, orgId, embedded, skipped, errors }.
 */
async function embedTable(tableName, orgId = null) {
  const entry = manifest[tableName];
  if (!entry || entry.skip) return null;

  const client = await pool.connect();
  let embedded = 0, skipped = 0, errors = 0;

  try {
    // Find stale rows: rows where updated_at > rag_embeddings.updated_at OR no embed exists
    // We fetch ALL rows and diff — acceptable for MVP (tables are not huge)
    const whereOrg = orgId ? `WHERE organization_id = $1` : '';
    const orgParam = orgId ? [orgId] : [];
    const { rows } = await client.query(
      `SELECT * FROM ${tableName} ${whereOrg}`, orgParam
    );

    // Already-embedded row IDs
    const embedWhere = orgId
      ? `WHERE organization_id = $1 AND table_name = $2`
      : `WHERE table_name = $1`;
    const embedParams = orgId ? [orgId, tableName] : [tableName];
    const { rows: existing } = await client.query(
      `SELECT row_id, updated_at as embed_updated FROM rag_embeddings ${embedWhere}`, embedParams
    );
    const embedMap = new Map(existing.map(r => [r.row_id, r.embed_updated]));

    for (const row of rows) {
      const rowOrgId = entry.getOrgId(row);
      if (!rowOrgId) { skipped++; continue; }

      const lastEmbed = embedMap.get(row.id);
      if (lastEmbed && row.updated_at && new Date(row.updated_at) <= new Date(lastEmbed)) {
        skipped++; continue;  // still fresh
      }

      try {
        await embedRow(rowOrgId, tableName, row, client);
        embedded++;
      } catch (e) {
        console.error(`[rag-embed] ${tableName}/${row.id}:`, e.message);
        errors++;
      }
    }
  } finally {
    client.release();
  }

  return { table: tableName, orgId: orgId || 'all', embedded, skipped, errors };
}

/**
 * Run full embedding pass across all SEARCHABLE_TABLES for all organizations.
 */
async function runFullEmbedding() {
  console.log('[rag-embed] Starting full embedding pass...');
  const start = Date.now();

  // Get distinct organization_ids from projects (all tenants have projects)
  const { rows: orgs } = await pool.query(
    `SELECT DISTINCT organization_id FROM projects WHERE organization_id IS NOT NULL`
  );

  const allResults = [];
  for (const tableName of SEARCHABLE_TABLES) {
    for (const { organization_id: orgId } of orgs) {
      const result = await embedTable(tableName, orgId);
      if (result) allResults.push(result);
    }
  }

  const total    = allResults.reduce((s, r) => s + r.embedded, 0);
  const totalErr = allResults.reduce((s, r) => s + r.errors, 0);
  const elapsed  = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[rag-embed] Done in ${elapsed}s — embedded ${total} rows, ${totalErr} errors`);
  return allResults;
}

/**
 * Embed a single entity immediately after CRUD (called by rag-trigger.js).
 */
async function embedEntity(tableName, row, userOrgId) {
  const client = await pool.connect();
  try {
    await embedRow(userOrgId, tableName, row, client);
  } finally {
    client.release();
  }
}

module.exports = { runFullEmbedding, embedTable, embedEntity, embedRow };
