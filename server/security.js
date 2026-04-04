const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// XSS middleware removed — React auto-escapes on the frontend.
// Stripping < and > from all strings destroyed legitimate content
// (HTML emails, markdown, math expressions).
// Kept sanitizeInput exported for explicit use cases only.
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

module.exports = {
  apiLimiter,
  authLimiter,
  securityHeaders,
  sanitizeInput,
};
