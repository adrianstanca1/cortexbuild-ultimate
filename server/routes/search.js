const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const SEARCHABLE_TABLES = [
  'projects',
  'invoices',
  'safety_incidents',
  'rfis',
  'change_orders',
  'team_members',
  'documents',
  'subcontractors',
  'contacts',
  'tenders',
  'rams',
  'meetings',
  'daily_reports',
];

router.get('/', async (req, res) => {
  try {
    const { q, limit = '20' } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' });
    }

    const searchTerm = `%${q.toLowerCase()}%`;
    const results = { projects: [], invoices: [], contacts: [], rfis: [], documents: [], team: [] };
    const limitNum = parseInt(limit, 10);

    const projectResults = await pool.query(
      `SELECT id, name, client, status, type FROM projects 
       WHERE LOWER(name) LIKE $1 OR LOWER(client) LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [searchTerm, limitNum]
    );
    results.projects = projectResults.rows;

    const invoiceResults = await pool.query(
      `SELECT id, number, client, amount, status FROM invoices 
       WHERE LOWER(number) LIKE $1 OR LOWER(client) LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [searchTerm, limitNum]
    );
    results.invoices = invoiceResults.rows;

    const contactResults = await pool.query(
      `SELECT id, name, company, email, role FROM contacts 
       WHERE LOWER(name) LIKE $1 OR LOWER(company) LIKE $1 OR LOWER(email) LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [searchTerm, limitNum]
    );
    results.contacts = contactResults.rows;

    const rfiResults = await pool.query(
      `SELECT id, number, subject, status, project FROM rfis 
       WHERE LOWER(number) LIKE $1 OR LOWER(subject) LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [searchTerm, limitNum]
    );
    results.rfis = rfiResults.rows;

    const docResults = await pool.query(
      `SELECT id, name, type, category, project FROM documents 
       WHERE LOWER(name) LIKE $1 OR LOWER(category) LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [searchTerm, limitNum]
    );
    results.documents = docResults.rows;

    const teamResults = await pool.query(
      `SELECT id, name, role, trade FROM team_members 
       WHERE LOWER(name) LIKE $1 OR LOWER(role) LIKE $1 OR LOWER(trade) LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [searchTerm, limitNum]
    );
    results.team = teamResults.rows;

    const totalResults = Object.values(results).flat().length;
    res.json({ results, total: totalResults, query: q });
  } catch (err) {
    console.error('[Global Search]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
