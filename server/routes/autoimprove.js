/**
 * server/routes/autoimprove.js
 * REST endpoints for autoimprove recommendations management.
 * GET /api/autoimprove/recommendations
 * POST /api/autoimprove/recommendations/:id/accept
 * POST /api/autoimprove/recommendations/:id/dismiss
 * GET /api/autoimprove/schedule
 * PUT /api/autoimprove/schedule
 */
const express = require('express');
const pool    = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const SUPER_ADMIN_ROLES = new Set(['super_admin']);

/** GET /api/autoimprove/recommendations */
router.get('/recommendations', async (req, res) => {
  try {
    const { status = 'pending', limit = '20' } = req.query;
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));

    let filter, params;
    if (SUPER_ADMIN_ROLES.has(req.user.role)) {
      filter = status !== 'all' ? 'WHERE status = $1' : '';
      params = status !== 'all' ? [status] : [];
    } else {
      const tid = req.user.organization_id || req.user.company_id;
      filter = status !== 'all'
        ? 'WHERE status = $1 AND COALESCE(organization_id, company_id) = $2'
        : 'WHERE COALESCE(organization_id, company_id) = $1';
      params = status !== 'all' ? [status, tid] : [tid];
    }

    const { rows } = await pool.query(`
      SELECT r.id, r.organization_id, r.project_id, r.type, r.severity,
             r.recommendation, r.auto_actions, r.status, r.created_at, r.resolved_at,
             p.name AS project_name
      FROM autoimprove_recommendations r
      LEFT JOIN projects p ON p.id = r.project_id
      ${filter ? filter.replace('WHERE', 'AND') : ''}
      ORDER BY
        CASE r.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        r.created_at DESC
      LIMIT $${params.length + 1}
    `, [...params, l]);

    res.json({ recommendations: rows, total: rows.length });
  } catch (err) {
    console.error('[autoimprove/recommendations]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** POST /api/autoimprove/recommendations/:id/accept */
router.post('/recommendations/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const tid = req.user.organization_id || req.user.company_id;

    const { rows } = await pool.query(`
      UPDATE autoimprove_recommendations
      SET status = 'accepted', resolved_at = NOW(), resolved_by = $1
      WHERE id = $2 AND COALESCE(organization_id, company_id) = $3
      RETURNING id, type, auto_actions
    `, [req.user.id, id, tid]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // TODO: Execute auto_actions if any (e.g., create_change_order)
    const rec = rows[0];
    console.log(`[autoimprove] Recommendation ${id} accepted by user ${req.user.id}`);

    res.json({ id: rec.id, status: 'accepted' });
  } catch (err) {
    console.error('[autoimprove/accept]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** POST /api/autoimprove/recommendations/:id/dismiss */
router.post('/recommendations/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const tid = req.user.organization_id || req.user.company_id;

    const { rows } = await pool.query(`
      UPDATE autoimprove_recommendations
      SET status = 'dismissed', resolved_at = NOW(), resolved_by = $1
      WHERE id = $2 AND COALESCE(organization_id, company_id) = $3
      RETURNING id
    `, [req.user.id, id, tid]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    res.json({ id: rows[0].id, status: 'dismissed' });
  } catch (err) {
    console.error('[autoimprove/dismiss]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** GET /api/autoimprove/schedule */
router.get('/schedule', async (req, res) => {
  try {
    const tid = req.user.organization_id || req.user.company_id;
    if (!tid && !SUPER_ADMIN_ROLES.has(req.user.role)) {
      return res.json({ schedule: null });
    }

    let query, params;
    if (SUPER_ADMIN_ROLES.has(req.user.role)) {
      query = 'SELECT * FROM autoimprove_schedules ORDER BY created_at DESC LIMIT 1';
      params = [];
    } else {
      query = 'SELECT * FROM autoimprove_schedules WHERE COALESCE(organization_id, company_id) = $1 LIMIT 1';
      params = [tid];
    }

    const { rows } = await pool.query(query, params);
    res.json({ schedule: rows[0] || null });
  } catch (err) {
    console.error('[autoimprove/schedule]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** PUT /api/autoimprove/schedule */
router.put('/schedule', async (req, res) => {
  try {
    const { frequency_hours, budget_threshold, safety_threshold, defect_threshold, enabled } = req.body;
    const tid = req.user.organization_id || req.user.company_id;

    if (!tid && !SUPER_ADMIN_ROLES.has(req.user.role)) {
      return res.status(403).json({ message: 'No tenant context' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (frequency_hours !== undefined) { fields.push(`frequency_hours = $${idx++}`); values.push(frequency_hours); }
    if (budget_threshold !== undefined) { fields.push(`budget_threshold = $${idx++}`); values.push(budget_threshold); }
    if (safety_threshold !== undefined) { fields.push(`safety_threshold = $${idx++}`); values.push(safety_threshold); }
    if (defect_threshold !== undefined) { fields.push(`defect_threshold = $${idx++}`); values.push(defect_threshold); }
    if (enabled !== undefined) { fields.push(`enabled = $${idx++}`); values.push(enabled); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    fields.push(`next_run_at = NOW() + ($${idx++} || ' hours')::INTERVAL`);
    values.push(frequency_hours || 24);

    let query;
    if (SUPER_ADMIN_ROLES.has(req.user.role)) {
      query = `UPDATE autoimprove_schedules SET ${fields.join(', ')} WHERE id = (SELECT id FROM autoimprove_schedules LIMIT 1) RETURNING *`;
    } else {
      query = `UPDATE autoimprove_schedules SET ${fields.join(', ')} WHERE COALESCE(organization_id, company_id) = $${idx++} RETURNING *`;
      values.push(tid);
    }

    const { rows } = await pool.query(query, values);
    res.json({ schedule: rows[0] || null });
  } catch (err) {
    console.error('[autoimprove/schedule PUT]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
