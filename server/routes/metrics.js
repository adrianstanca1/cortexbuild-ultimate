const express = require('express');
const os = require('os');
const pool = require('../db');

const router = express.Router();
const requestCounts = { total: 0, byMethod: {}, byStatus: {} };

router.use((req, res, next) => {
  requestCounts.total++;
  requestCounts.byMethod[req.method] = (requestCounts.byMethod[req.method] || 0) + 1;
  next();
});

router.get('/', async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const load = os.loadavg();
    const dbPool = pool;
    const metrics = {
      process: { uptime_seconds: uptime, memory_heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024) },
      system: { load_1m: load[0], load_5m: load[1], total_memory_mb: Math.round(os.totalmem() / 1024 / 1024), free_memory_mb: Math.round(os.freemem() / 1024 / 1024) },
      http: { total_requests: requestCounts.total, by_method: requestCounts.byMethod },
      database: { total: dbPool.totalCount, idle: dbPool.idleCount, waiting: dbPool.waitingCount },
      timestamp: new Date().toISOString(),
    };
    if (req.query.format === 'prometheus') {
      const lines = [
        'cortexbuild_uptime_seconds ' + metrics.process.uptime_seconds,
        'cortexbuild_memory_heap_bytes ' + (metrics.process.memory_heap_used_mb * 1024 * 1024),
        'cortexbuild_http_requests_total ' + metrics.http.total_requests,
        'cortexbuild_db_connections ' + metrics.database.total,
        'cortexbuild_system_load_1m ' + metrics.system.load_1m,
      ];
      res.set('Content-Type', 'text/plain');
      res.send(lines.join('\n'));
    } else {
      res.json(metrics);
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});

module.exports = router;
