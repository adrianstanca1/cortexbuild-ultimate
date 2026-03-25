const express = require('express');
const router = express.Router();
const pool = require('../db');

const ALLOWED_TABLES = [
  'projects', 'invoices', 'safety_incidents', 'rfis', 'change_orders',
  'team_members', 'equipment', 'subcontractors', 'documents', 'timesheets',
  'meetings', 'materials', 'punch_list', 'inspections', 'rams', 'cis_returns',
  'tenders', 'contacts', 'risk_register', 'purchase_orders', 'daily_reports',
  'variations', 'defects', 'valuations', 'specifications', 'temp_works',
  'signage', 'waste_management', 'sustainability', 'training',
  'certifications', 'prequalification', 'lettings', 'measuring',
  'notifications', 'users', 'audit_log',
];

router.get('/tables', async (req, res) => {
  try {
    res.json({ tables: ALLOWED_TABLES });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/export/:table', async (req, res) => {
  const { table } = req.params;
  const { format = 'json', limit = '10000' } = req.query;

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(403).json({ message: 'Table not allowed for export' });
  }

  const limitNum = Math.min(parseInt(limit, 10), 50000);
  try {
    const result = await pool.query(
      `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT $1`,
      [limitNum]
    );

    if (format === 'csv') {
      if (result.rows.length === 0) {
        return res.status(200).send('No data');
      }
      const headers = Object.keys(result.rows[0]);
      const csvRows = [
        headers.join(','),
        ...result.rows.map(row =>
          headers.map(h => {
            const val = row[h] === null ? '' : String(row[h]).replace(/"/g, '""');
            return `"${val}"`;
          }).join(',')
        ),
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${table}-export.csv"`);
      return res.send(csvRows.join('\n'));
    }

    res.setHeader('Content-Disposition', `attachment; filename="${table}-export.json"`);
    res.json({ table, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/export-all', async (req, res) => {
  const { format = 'json' } = req.query;
  try {
    const allData = {};
    for (const table of ALLOWED_TABLES) {
      try {
        const result = await pool.query(
          `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 10000`
        );
        allData[table] = { count: result.rows.length, rows: result.rows };
      } catch {
        allData[table] = { count: 0, rows: [], error: 'table not found or inaccessible' };
      }
    }
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '3.0.0',
      tables: Object.keys(allData),
      data: allData,
    };
    res.setHeader('Content-Disposition', `attachment; filename="cortexbuild-backup-${Date.now()}.json"`);
    res.json(backup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
