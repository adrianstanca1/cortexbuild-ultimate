require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');
const { databaseUrlWantsSsl, effectiveDatabaseUrl } = require('./lib/pgConnectionEnv');

let poolConfig;

const databaseUrl = effectiveDatabaseUrl();
if (databaseUrl) {
  const useSsl = databaseUrlWantsSsl(databaseUrl);
  poolConfig = {
    connectionString: databaseUrl,
    ssl: useSsl
      ? {
          // Default false matches prior production config; set DATABASE_SSL_REJECT_UNAUTHORIZED=true for strict verify
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
        }
      : false,
    max: 20,
    min: 4,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 60000,
  };
} else {
  // Local or legacy configuration
  const dbPassword = process.env.DB_PASSWORD;
  if (!dbPassword) {
    console.error('[SECURITY] DB_PASSWORD environment variable is not set — refusing to connect');
    process.exit(1);
  }

  poolConfig = {
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'cortexbuild',
    user:     process.env.DB_USER     || 'cortexbuild',
    password: dbPassword,
    max:      20,
    min:      4,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 60000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

module.exports = pool;
