const Redis = require('redis');
const rateLimits = new Map(); // Fallback for non-Redis environments

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

// Redis client for cluster-safe rate limiting
let redisClient = null;
const REDIS_ENABLED = process.env.REDIS_URL;

if (REDIS_ENABLED) {
  redisClient = Redis.createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => {
    console.error('[Redis] Rate limiter connection error:', err.message);
  });
  // Fire-and-forget connection - don't block server startup
  redisClient.connect().catch(() => {});
}

function getClientKey(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : 'anonymous';
  return `rate_limit:${token}:${req.path.replace(/\//g, '_')}`;
}

function cleanExpired(map) {
  const now = Date.now();
  for (const [key, record] of map.entries()) {
    if (record.resetAt <= now) map.delete(key);
  }
}

module.exports = function rateLimiter(req, res, next) {
  const key = getClientKey(req);
  const now = Date.now();

  // Redis-backed rate limiting (cluster-safe)
  if (redisClient && redisClient.isOpen) {
    return redisClient
      .incr(key)
      .then((count) => {
        if (count === 1) {
          // First request - set expiry
          redisClient.pExpire(key, WINDOW_MS);
        }
        if (count > MAX_REQUESTS) {
          redisClient.pTTL(key).then((ttl) => {
            const retryAfter = Math.ceil(ttl / 1000);
            res.set('Retry-After', retryAfter);
            res.status(429).json({
              message: 'Too many requests. Please try again later.',
              retryAfter,
            });
          });
        } else {
          next();
        }
      })
      .catch(() => {
        // Redis failed — in production, fail closed (deny requests) since
        // in-memory fallback is insecure in multi-instance deployments.
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({
            message: 'Service temporarily unavailable. Rate limiting service error.',
          });
        }
        // Dev/staging: fall back to in-memory (single-instance only)
        fallbackRateLimiter(req, res, next);
      });
  }

  // Fallback to in-memory (single-instance only)
  fallbackRateLimiter(req, res, next);
}

function fallbackRateLimiter(req, res, next) {
  cleanExpired(rateLimits);
  const key = getClientKey(req);
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || record.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter,
    });
  }

  record.count++;
  next();
}

module.exports.RATE_LIMITER_MAX = MAX_REQUESTS;
module.exports.RATE_LIMITER_WINDOW_MS = WINDOW_MS;
