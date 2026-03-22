const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { table, record_id, user_id, limit = '100' } = req.query;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (table) {
      params.push(table);
      query += ` AND table_name = $${params.length}`;
    }
    if (record_id) {
      params.push(record_id);
      query += ` AND record_id = $${params.length}`;
    }
    if (user_id) {
      params.push(user_id);
      query += ` AND user_id = $${params.length}`;
    }

    params.push(parseInt(limit, 10));
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[Audit Log GET]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { table_name, record_id, action, changes, user_id } = req.body;

    if (!table_name || !action) {
      return res.status(400).json({ message: 'table_name and action are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO audit_log (table_name, record_id, action, changes, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [table_name, record_id, action, changes ? JSON.stringify(changes) : null, user_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Audit Log POST]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { rows: byAction } = await pool.query(
      `SELECT action, COUNT(*) as count FROM audit_log 
       WHERE created_at > NOW() - INTERVAL '7 days'
       GROUP BY action ORDER BY count DESC`
    );

    const { rows: byTable } = await pool.query(
      `SELECT table_name, COUNT(*) as count FROM audit_log 
       WHERE created_at > NOW() - INTERVAL '7 days'
       GROUP BY table_name ORDER BY count DESC LIMIT 10`
    );

    const { rows: recent } = await pool.query(
      `SELECT COUNT(*) as total FROM audit_log 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );

    res.json({
      byAction,
      byTable,
      last24Hours: parseInt(recent[0]?.total || 0, 10),
    });
  } catch (err) {
    console.error('[Audit Stats]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
