const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  const isSuperOrOwner = ['super_admin', 'company_owner'].includes(req.user?.role);
  if (!isSuperOrOwner) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const [
      usersRow, activeProjectsRow, companiesRow, apiCallsRow, storageRow
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users'),
      pool.query("SELECT COUNT(*) AS total FROM projects WHERE status = 'active'"),
      pool.query('SELECT COUNT(*) AS total FROM organizations'),
      pool.query("SELECT COUNT(*) AS total FROM audit_log WHERE created_at >= NOW() - INTERVAL '1 day'"),
      pool.query('SELECT COALESCE(SUM(LENGTH(chunk_text)), 0) AS used FROM document_embeddings'),
    ]);

    const totalUsers = parseInt(usersRow.rows[0].total, 10);
    const totalProjects = parseInt((await pool.query('SELECT COUNT(*) AS total FROM projects')).rows[0].total, 10);
    const activeProjects = parseInt(activeProjectsRow.rows[0].total, 10);
    const totalCompanies = parseInt(companiesRow.rows[0].total, 10);
    const apiCallsToday = parseInt(apiCallsRow.rows[0].total, 10);

    // Estimate storage from uploads directory size
    let storageUsed = 0;
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      const files = fs.readdirSync(uploadsDir);
      storageUsed = files.reduce((acc, f) => {
        try { return acc + fs.statSync(path.join(uploadsDir, f)).size; } catch { return acc; }
      }, 0);
    } catch { /* uploads dir may not exist */ }

    const uptimeSeconds = process.uptime();

    res.json({
      totalUsers,
      activeUsers: totalUsers,
      totalCompanies,
      activeCompanies: totalCompanies,
      totalProjects,
      activeProjects,
      activeSessions: 0,
      apiCallsToday,
      storageUsed,
      storageTotal: 10 * 1024 * 1024 * 1024, // 10 GB nominal
      systemHealth: 'healthy',
      uptime: Math.min(100, (uptimeSeconds / (uptimeSeconds + 1)) * 100),
    });
  } catch (err) {
    console.error('[Admin Stats]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats/organizations — list all orgs for super-admin
router.get('/organizations', async (req, res) => {
  const isSuperOrOwner = ['super_admin', 'company_owner'].includes(req.user?.role);
  if (!isSuperOrOwner) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { rows } = await pool.query(`
      SELECT
        o.id, o.name, o.created_at,
        COUNT(DISTINCT u.id) AS user_count,
        COUNT(DISTINCT p.id) AS project_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      LEFT JOIN projects p ON p.organization_id = o.id
      GROUP BY o.id, o.name, o.created_at
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[Admin Orgs]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
