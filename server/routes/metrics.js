/* Metrics: Tracks HTTP request/response times and sends structured metrics to Prometheus
   This module adds a way to scrape performance metrics into Prometheus

Author: Canary CI / CortexBuild Ultimate Infrastructure Team
Date: 2026-04-06
*/

const promClient = require('prom-client');

const register = new promClient.Registry();
register.add('http_request_duration_seconds', {
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'method_name', 'endpoint', 'status_code'],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'method_name', 'endpoint', 'status_code'],
});

// Metrics configuration with Prometheus scrape config
const metricsConfig = {
  prometheus: {
    endpoint: '/api/metrics',
    schema: 'application/json',
  },
};

const promServer = promServer(metricsConfig);

const app = require('./index.js');

// Initialize Prometheus metrics server
promServer.init().catch(err => {
    console.error('Unable to initialize Prometheus metrics server:', err);
});

// Helper to get endpoint details
const getEndpointDetails = (method, method_name, endpoint, status_code) => {
  return {
    method, method_name, endpoint, status_code,
    url: `${method}_${method_name}_${endpoint || '/'}`,
  };
};

// Metrics export
module.exports = { httpRequestDuration, promServer, getEndpointDetails, metricsConfig };
