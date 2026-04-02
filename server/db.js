require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) {
  console.error('[SECURITY] DB_PASSWORD environment variable is not set — refusing to connect');
  process.exit(1);
}

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'cortexbuild',
  user:     process.env.DB_USER     || 'cortexbuild',
  password: dbPassword,
  // Connection pool limits - prevent exhaustion under load
  max:      20,                      // Max 20 clients in pool
  min:      4,                       // Keep 4 idle clients ready
  idleTimeoutMillis: 30000,          // Drop idle clients after 30s
  connectionTimeoutMillis: 5000,     // Fail fast if can't connect (5s)
  statement_timeout: 30000,          // Abort queries running > 30s
  query_timeout: 60000,              // Abort queries running > 60s
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

module.exports = pool;
