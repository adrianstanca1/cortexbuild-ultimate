/**
 * Stricter rate limiter for file upload endpoints
 * Uploads are expensive operations (I/O, storage, processing)
 * Limit: 20 requests per minute per user
 */
const Redis = require('redis');
const rateLimits = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20; // Stricter limit for uploads

let redisClient = null;
const REDIS_ENABLED = process.env.REDIS_URL;

if (REDIS_ENABLED) {
  redisClient = Redis.createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => {
    console.error('[Redis] Upload rate limiter connection error:', err.message);
  });
  redisClient.connect().catch(() => {});
}

function getClientKey(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : 'anonymous';
  return `rate_limit_upload:${token}:${req.path.replace(/\//g, '_')}`;
}

function cleanExpired(map) {
  const now = Date.now();
  for (const [key, record] of map.entries()) {
    if (record.resetAt <= now) map.delete(key);
  }
}

module.exports = function uploadRateLimiter(req, res, next) {
  const key = getClientKey(req);
  const now = Date.now();

  if (redisClient && redisClient.isOpen) {
    return redisClient
      .incr(key)
      .then((count) => {
        if (count === 1) {
          redisClient.pExpire(key, WINDOW_MS);
        }
        if (count > MAX_REQUESTS) {
          redisClient.pTTL(key).then((ttl) => {
            const retryAfter = Math.ceil(ttl / 1000);
            res.set('Retry-After', retryAfter);
            res.status(429).json({
              message: 'Too many upload requests. Please try again later.',
              retryAfter,
            });
          });
        } else {
          next();
        }
      })
      .catch(() => {
        fallbackRateLimiter(req, res, next);
      });
  }

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
      message: 'Too many upload requests. Please try again later.',
      retryAfter,
    });
  }

  record.count++;
  next();
}

module.exports.UPLOAD_RATE_LIMIT_MAX = MAX_REQUESTS;
module.exports.UPLOAD_RATE_LIMIT_WINDOW_MS = WINDOW_MS;
