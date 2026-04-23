/**
 * One-shot bootstrap for empty Postgres (Docker / local compose).
 * Runs the same SQL sequence as render-init-db.js, but resolves paths for:
 *   - monorepo checkout (server/scripts → repo root)
 *   - Docker image layout (WORKDIR /app with server files at /app)
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function resolveSqlPaths() {
  const repoRoot = path.join(__dirname, '..', '..');
  if (fs.existsSync(path.join(repoRoot, 'server', 'migrations', '000_platform_core.sql'))) {
    return {
      setup: path.join(repoRoot, 'server', 'scripts', 'setup.sql'),
      seed: path.join(repoRoot, 'server', 'scripts', 'seed.sql'),
      mig: (name) => path.join(repoRoot, 'server', 'migrations', name),
    };
  }
  const appRoot = path.join(__dirname, '..');
  if (fs.existsSync(path.join(appRoot, 'migrations', '000_platform_core.sql'))) {
    return {
      setup: path.join(appRoot, 'scripts', 'setup.sql'),
      seed: path.join(appRoot, 'scripts', 'seed.sql'),
      mig: (name) => path.join(appRoot, 'migrations', name),
    };
  }
  throw new Error('[ensure-database] Cannot locate server/migrations (wrong cwd or incomplete image)');
}

function pgClientConfig() {
  if (process.env.DATABASE_URL) {
    const ssl =
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' }
        : false;
    return { connectionString: process.env.DATABASE_URL, ssl };
  }
  const password = process.env.DB_PASSWORD;
  if (!password) {
    console.error('[ensure-database] DB_PASSWORD or DATABASE_URL is required');
    process.exit(1);
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'cortexbuild',
    user: process.env.DB_USER || 'cortexbuild',
    password,
    ssl: false,
  };
}

async function runSqlFile(client, filePath) {
  console.log(`[ensure-database] Running ${path.basename(filePath)}...`);
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`[ensure-database] Missing file, skipping: ${filePath}`);
      return;
    }
    throw e;
  }
}

async function isBootstrapped(client) {
  const r = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'organization_id'
    ) AS ok;
  `);
  return Boolean(r.rows[0]?.ok);
}

async function main() {
  const paths = resolveSqlPaths();
  const client = new Client(pgClientConfig());
  await client.connect();
  console.log('[ensure-database] Connected to Postgres');

  if (await isBootstrapped(client)) {
    console.log('[ensure-database] Schema already present (users.organization_id). Skipping.');
    await client.end();
    return;
  }

  console.log('[ensure-database] Bootstrapping schema and seed data...');

  await runSqlFile(client, paths.setup);
  await runSqlFile(client, paths.mig('000_platform_core.sql'));
  await runSqlFile(client, paths.mig('001_add_audit_log.sql'));
  await runSqlFile(client, paths.mig('002_add_email_tables.sql'));
  await runSqlFile(client, paths.mig('003_add_report_templates.sql'));

  try {
    await runSqlFile(client, paths.mig('040_embeddings.sql'));
  } catch (e) {
    console.log('[ensure-database] Skipped 040_embeddings.sql:', e.message);
  }

  await runSqlFile(client, paths.mig('005_add_permissions.sql'));
  await runSqlFile(client, paths.mig('041_add_team_member_data.sql'));
  await runSqlFile(client, paths.mig('006_add_equipment_permits.sql'));
  await runSqlFile(client, paths.mig('007_add_risk_mitigation_actions.sql'));
  await runSqlFile(client, paths.mig('008_add_contact_interactions.sql'));
  await runSqlFile(client, paths.mig('009_add_safety_permits.sql'));
  await runSqlFile(client, paths.mig('010_add_toolbox_talks.sql'));
  await runSqlFile(client, paths.mig('011_add_drawing_transmittals.sql'));
  await runSqlFile(client, paths.mig('013_enhanced_projects.sql'));
  await runSqlFile(client, paths.mig('014_add_email_templates.sql'));
  await runSqlFile(client, paths.mig('035_new_modules_corrected.sql'));
  // 016 adds users.organization_id / company_id required by seed.sql — must run before seed.
  await runSqlFile(client, paths.mig('016_local_dev_reconcile.sql'));
  await runSqlFile(client, paths.seed);
  await runSqlFile(client, paths.mig('012_seed_audit_log.sql'));
  await runSqlFile(client, paths.mig('060_add_invoices_payment_fields.sql'));

  try {
    await runSqlFile(client, paths.mig('015_add_ai_conversation_indexes.sql'));
  } catch (e) {
    console.log('[ensure-database] Warning on 015_add_ai_conversation_indexes.sql:', e.message);
  }

  // Worker + auth tables expected by runtime (workers poll; /auth/me reads totp_enabled).
  await runSqlFile(client, paths.mig('028_add_bim_processing_queue.sql'));
  await runSqlFile(client, paths.mig('061_add_autoresearch.sql'));
  await runSqlFile(client, paths.mig('062_add_autoimprove.sql'));
  await runSqlFile(client, paths.mig('063_add_autorepair.sql'));
  await runSqlFile(client, paths.mig('064_harden_schema.sql'));
  await runSqlFile(client, paths.mig('065_notification_infrastructure.sql'));
  await runSqlFile(client, paths.mig('066_auth_hardening.sql'));
  await runSqlFile(client, paths.mig('067_add_project_coordinates.sql'));

  await client.end();
  console.log('[ensure-database] Bootstrap complete.');
}

main().catch((err) => {
  console.error('[ensure-database] Failed:', err);
  process.exit(1);
});
