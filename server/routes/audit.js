const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();
router.use(authMiddleware);
router.use(checkPermission('audit-log', 'read'));

// super_admin sees all audit logs; others see only their organization
router.get('/', async (req, res) => {
  try {
    const { table, record_id, user_id, limit = '100', start_date, end_date } = req.query;
    const isSuper = req.user?.role === 'super_admin';
    const orgId = req.user?.organization_id;
    const params = [];
    let conditions = [];

    if (!isSuper) {
      // Non-super_admin users must have an organization_id
      if (!orgId) return res.status(403).json({ message: 'No organization context' });
      conditions.push(`organization_id = $${params.length + 1}`);
      params.push(orgId);
    }
    // super_admin: no organization filter — sees everything

    if (table) {
      params.push(table);
      conditions.push(`table_name = $${params.length}`);
    }
    if (record_id) {
      params.push(record_id);
      conditions.push(`record_id = $${params.length}`);
    }
    if (user_id) {
      params.push(user_id);
      conditions.push(`user_id = $${params.length}`);
    }
    if (start_date) {
      params.push(start_date);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (end_date) {
      params.push(end_date);
      conditions.push(`created_at <= $${params.length}`);
    }

    params.push(parseInt(limit, 10));
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT al.*, u.name as user_name, u.email as user_email
                  FROM audit_log al
                  LEFT JOIN users u ON u.id = al.user_id
                  ${where}
                  ORDER BY al.created_at DESC LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[Audit Log GET]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /audit — write an audit log entry (auto-assigns org from user)
router.post('/', async (req, res) => {
  try {
    const { table_name, record_id, action, changes, user_id } = req.body;

    if (!table_name || !action) {
      return res.status(400).json({ message: 'table_name and action are required' });
    }

    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `INSERT INTO audit_log (table_name, record_id, action, changes, user_id, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [table_name, record_id, action, changes ? JSON.stringify(changes) : null, user_id, orgId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Audit Log POST]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /audit/stats — audit statistics
router.get('/stats', async (req, res) => {
  try {
    const isSuper = req.user?.role === 'super_admin';
    const orgId = req.user?.organization_id;
    const dateCond = 'created_at > NOW() - INTERVAL \'7 days\'';
    const { rows: byAction } = await pool.query(
      `SELECT action, COUNT(*) as count FROM audit_log ${isSuper ? 'WHERE' : 'WHERE organization_id = $1 AND'} ${dateCond} GROUP BY action ORDER BY count DESC`,
      isSuper ? [] : [orgId]
    );

    const { rows: byTable } = await pool.query(
      `SELECT table_name, COUNT(*) as count FROM audit_log ${isSuper ? 'WHERE' : 'WHERE organization_id = $1 AND'} ${dateCond} GROUP BY table_name ORDER BY count DESC LIMIT 10`,
      isSuper ? [] : [orgId]
    );

    const { rows: recent } = await pool.query(
      `SELECT COUNT(*) as total FROM audit_log ${isSuper ? 'WHERE' : 'WHERE organization_id = $1 AND'} created_at > NOW() - INTERVAL '24 hours'`,
      isSuper ? [] : [orgId]
    );

    res.json({
      byAction,
      byTable,
      last24Hours: parseInt(recent[0]?.total || 0, 10),
    });
  } catch (err) {
    console.error('[Audit Stats]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /audit/export — CSV export of audit logs
router.get('/export', async (req, res) => {
  try {
    const isSuper = req.user?.role === 'super_admin';
    const orgId = req.user?.organization_id;
    const { table, action, limit = '10000' } = req.query;
    const params = [];
    let conditions = [];

    if (!isSuper) {
      if (!orgId) return res.status(403).json({ message: 'No organization context' });
      conditions.push(`organization_id = $${params.length + 1}`);
      params.push(orgId);
    }
    if (table) {
      params.push(table);
      conditions.push(`table_name = $${params.length}`);
    }
    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }

    params.push(Math.min(parseInt(limit, 10), 50000));
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_log al LEFT JOIN users u ON u.id = al.user_id
       ${where} ORDER BY al.created_at DESC LIMIT $${params.length}`,
      params
    );

    if (rows.length === 0) return res.status(200).send('No data');

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const headers = ['id', 'action', 'table_name', 'record_id', 'changes', 'user_name', 'user_email', 'ip_address', 'created_at'];
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escapeCsv(r[h])).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('[Audit Export]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
