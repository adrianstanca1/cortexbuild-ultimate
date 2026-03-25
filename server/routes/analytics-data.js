const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/overtime', async (req, res) => {
  try {
    const auth = req.user || {};
    const orgId = auth.organization_id;
    const companyId = auth.company_id;
    const isSuper = ['super_admin', 'company_owner'].includes(auth.role);

    let params = [];
    let where = '';
    if (orgId && !isSuper) {
      where = 'WHERE t.organization_id = $1';
      params.push(orgId);
    }

    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', t.week), 'Mon') as month,
        DATE_TRUNC('month', t.week) as sort_key,
        COALESCE(SUM(t.overtime_hours), 0) as overtime,
        COALESCE(SUM(t.regular_hours), 0) as regular
      FROM timesheets t
      ${where}
      GROUP BY DATE_TRUNC('month', t.week)
      ORDER BY sort_key
      LIMIT 12
    `, params);

    const data = result.rows.map(r => ({
      month: r.month,
      overtime: r.regular > 0 ? Number(((r.overtime / r.regular) * 100).toFixed(1)) : 0
    }));

    res.json(data);
  } catch (err) {
    console.error('overtime error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/vat', async (req, res) => {
  try {
    const auth = req.user || {};
    const orgId = auth.organization_id;
    const isSuper = ['super_admin', 'company_owner'].includes(auth.role);

    let params = [];
    let where = '';
    if (orgId && !isSuper) {
      where = 'WHERE organization_id = $1';
      params.push(orgId);
    }

    const result = await pool.query(`
      SELECT
        'Q' || EXTRACT(QUARTER FROM due_date)::text as quarter,
        COALESCE(SUM(amount), 0) as liability,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid,
        MAX(status) as status
      FROM invoices
      ${where}
      GROUP BY 'Q' || EXTRACT(QUARTER FROM due_date)::text, EXTRACT(QUARTER FROM due_date)
      ORDER BY EXTRACT(QUARTER FROM due_date)
    `, params);

    const data = result.rows.map(r => ({
      quarter: r.quarter,
      liability: Number(r.liability),
      paid: Number(r.paid),
      status: r.status === 'paid' ? 'paid' : r.liability > r.paid ? 'due' : 'estimated'
    }));

    res.json(data);
  } catch (err) {
    console.error('vat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
