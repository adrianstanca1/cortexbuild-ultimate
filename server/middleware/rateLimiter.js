const rateLimits = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

function getClientKey(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : 'anonymous';
  return `${token}:${req.path}`;
}

function cleanExpired(map) {
  const now = Date.now();
  for (const [key, record] of map.entries()) {
    if (record.resetAt <= now) map.delete(key);
  }
}

module.exports = function rateLimiter(req, res, next) {
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
