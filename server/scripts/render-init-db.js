const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { databaseUrlWantsSsl, effectiveDatabaseUrl } = require('../lib/pgConnectionEnv');

const connectionString = effectiveDatabaseUrl();

if (!connectionString) {
    console.error('DATABASE_URL environment variable is required for Render DB initialization.');
    process.exit(1);
}

async function runSqlFile(client, filePath) {
    console.log(`Running ${path.basename(filePath)}...`);
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log(`File ${filePath} not found, skipping.`);
            return;
        }
        throw e;
    }
}

async function connectWithRetry(connectionString, maxRetries = 3) {
    const useSsl = databaseUrlWantsSsl(connectionString);
    // Render Postgres always requires SSL; force it if the host looks managed
    const forceSsl = useSsl || /\.render\.com\b/i.test(connectionString);
    const sslConfig = forceSsl
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' }
        : false;

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const client = new Client({
            connectionString,
            ssl: sslConfig,
            connectionTimeoutMillis: 10000,
        });
        try {
            console.log(`[render-init-db] Connection attempt ${attempt}/${maxRetries}...`);
            await client.connect();
            console.log('[render-init-db] Connected successfully');
            return client;
        } catch (err) {
            lastError = err;
            console.error(`[render-init-db] Connection attempt ${attempt} failed: ${err.message}`);
            try { await client.end(); } catch (_) {}
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`[render-init-db] Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}

async function main() {
    const client = await connectWithRetry(connectionString);
        console.log('Connected to database for initialization');

        // Check if database is already initialized by looking for a core table
        const checkRes = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'projects'
            );
        `);

        if (checkRes.rows[0].exists) {
            console.log('Database appears to be already initialized (projects table exists). Skipping initialization.');
            return;
        }

        const rootDir = path.join(__dirname, '..', '..');

        console.log('Starting database initialization...');

        await runSqlFile(client, path.join(rootDir, 'server/scripts/setup.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/000_platform_core.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/001_add_audit_log.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/002_add_email_tables.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/003_add_report_templates.sql'));

        // Try embeddings, but don't fail if pgvector extension fails to create
        try {
            await runSqlFile(client, path.join(rootDir, 'server/migrations/040_embeddings.sql'));
        } catch(e) {
            console.log('Skipped embeddings.sql due to error (possibly missing pgvector extension):', e.message);
        }

        await runSqlFile(client, path.join(rootDir, 'server/migrations/005_add_permissions.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/041_add_team_member_data.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/006_add_equipment_permits.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/007_add_risk_mitigation_actions.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/008_add_contact_interactions.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/009_add_safety_permits.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/010_add_toolbox_talks.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/011_add_drawing_transmittals.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/013_enhanced_projects.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/014_add_email_templates.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/035_new_modules_corrected.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/016_local_dev_reconcile.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/scripts/seed.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/012_seed_audit_log.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/060_add_invoices_payment_fields.sql'));

        // Try conversational indexes
        try {
            await runSqlFile(client, path.join(rootDir, 'server/migrations/015_add_ai_conversation_indexes.sql'));
        } catch (e) {
            console.log('Warning on 015_add_ai_conversation_indexes.sql:', e.message);
        }

        await runSqlFile(client, path.join(rootDir, 'server/migrations/025_add_bim_models.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/028_add_bim_processing_queue.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/061_add_autoresearch.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/062_add_autoimprove.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/063_add_autorepair.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/064_harden_schema.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/065_notification_infrastructure.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/066_auth_hardening.sql'));
        await runSqlFile(client, path.join(rootDir, 'server/migrations/067_add_project_coordinates.sql'));

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
