import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, keyGenerator, message = 'Too many requests' } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    next();
  };
}

export function cleanupExpiredEntries() {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

setInterval(cleanupExpiredEntries, 60000);

export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip || 'unknown',
  message: 'Too many authentication attempts',
});
