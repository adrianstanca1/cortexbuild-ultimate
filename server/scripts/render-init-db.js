const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required for Render DB initialization.');
  process.exit(1);
}

async function main() {
    console.log(`[render-init-db] DATABASE_URL length: ${connectionString.length}`);
    console.log(`[render-init-db] Connecting with ssl: { rejectUnauthorized: false }...`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        await client.connect();
        console.log('[render-init-db] Connected successfully');

        const res = await client.query('SELECT NOW() as now, version() as version');
        console.log(`[render-init-db] Query OK: ${res.rows[0].now}`);
        console.log(`[render-init-db] Postgres version: ${res.rows[0].version}`);

        // Check if projects table exists
        const checkRes = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'projects'
            );
        `);

        if (checkRes.rows[0].exists) {
            console.log('[render-init-db] Database already initialized (projects table exists). Skipping.');
            await client.end();
            return;
        }

        console.log('[render-init-db] Database not initialized. Running migrations...');
        // TODO: run migrations
        console.log('[render-init-db] Migrations skipped for now.');

        await client.end();
        console.log('[render-init-db] Done.');
    } catch (err) {
        console.error('[render-init-db] Error:', err.message);
        console.error('[render-init-db] Stack:', err.stack);
        process.exit(1);
    }
}

main();
