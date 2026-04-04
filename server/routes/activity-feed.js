const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

/**
 * GET /api/activity-feed
 * Get activity feed with optional filtering.
 * Query params: entity_type, time_range, limit, offset
 */
router.get('/', async (req, res) => {
  const { entity_type, time_range, limit = '50', offset = '0' } = req.query;
  const orgId = req.user?.organization_id;
  const isSuper = ['super_admin', 'company_owner'].includes(req.user?.role);

  try {
    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (orgId && !isSuper) {
      whereClauses.push(`a.organization_id = $${paramIndex}`);
      params.push(orgId);
      paramIndex++;
    }

    if (entity_type && entity_type !== 'all') {
      whereClauses.push(`a.entity_type = $${paramIndex}`);
      params.push(entity_type);
      paramIndex++;
    }

    if (time_range) {
      const now = new Date();
      let dateFilter;
      switch (time_range) {
        case 'today':
          dateFilter = now.toISOString().split('T')[0];
          whereClauses.push(`DATE(a.created_at) = $${paramIndex}`);
          params.push(dateFilter);
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          whereClauses.push(`a.created_at >= $${paramIndex}`);
          params.push(weekAgo.toISOString());
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          whereClauses.push(`a.created_at >= $${paramIndex}`);
          params.push(monthAgo.toISOString());
          break;
      }
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT a.*, u.name as user_name, u.role as user_role
       FROM activity_log a
       LEFT JOIN users u ON u.id = a.user_id
       ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Activity Feed] Failed to load:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
