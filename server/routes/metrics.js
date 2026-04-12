/* Metrics: HTTP request/response times exposed to Prometheus
   Endpoint: GET /api/metrics
*/

const express = require('express');
const promClient = require('prom-client');
const authMw = require('../middleware/auth');

const router = express.Router();

// Create a Registry
const register = new promClient.Registry();

// Enable collection of default metrics (heap, event loop, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metric: HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// Expose metrics endpoint for Prometheus scraping (no auth — Prometheus is internal network only)
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (err) {
    console.error('[Metrics]', err);
    res.status(500).send('Metrics error');
  }
});

// Middleware: observe request duration (must be mounted before routes)
function observeRequest(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode })
      .observe(duration);
  });
  next();
}

module.exports = { router, observeRequest, httpRequestDuration, register };
