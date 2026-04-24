const { Client } = require('pg');
const url = require('url');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required for Render DB initialization.');
  process.exit(1);
}

async function main() {
    console.log(`[render-init-db] DATABASE_URL length: ${connectionString.length}`);

    // Parse DATABASE_URL manual
    const parsed = new url.URL(connectionString);
    const config = {
        host: parsed.hostname,
        port: parseInt(parsed.port) || 5432,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    };

    console.log(`[render-init-db] Host: ${config.host}`);
    console.log(`[render-init-db] Port: ${config.port}`);
    console.log(`[render-init-db] User: ${config.user}`);
    console.log(`[render-init-db] Database: ${config.database}`);

    const client = new Client(config);

    try {
        await client.connect();
        console.log('[render-init-db] Connected successfully');

        const res = await client.query('SELECT NOW() as now');
        console.log(`[render-init-db] Query OK: ${res.rows[0].now}`);

        await client.end();
        console.log('[render-init-db] Done.');
    } catch (err) {
        console.error('[render-init-db] Error:', err.message);
        console.error('[render-init-db] Stack:', err.stack);
        process.exit(1);
    }
}

main();
