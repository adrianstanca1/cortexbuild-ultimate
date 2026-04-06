const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    const events = [];

    const addDays = (dateStr, days) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const { rows: projects } = await pool.query(
      `SELECT id, name, client, status, start_date, end_date, type FROM projects 
       WHERE start_date IS NOT NULL ORDER BY start_date`
    );
    projects.forEach(p => {
      events.push({
        id: `project-${p.id}`,
        title: p.name,
        type: 'project',
        subtype: p.type || 'General',
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status,
        client: p.client,
        url: `/projects/${p.id}`,
      });
    });

    const { rows: meetings } = await pool.query(
      `SELECT id, title, date, time, status, project FROM meetings 
       WHERE date IS NOT NULL ORDER BY date`
    );
    meetings.forEach(m => {
      events.push({
        id: `meeting-${m.id}`,
        title: m.title,
        type: 'meeting',
        subtype: 'Meeting',
        startDate: m.date,
        time: m.time,
        status: m.status,
        project: m.project,
        url: `/meetings/${m.id}`,
      });
    });

    const { rows: inspections } = await pool.query(
      `SELECT id, type as title, date, status, project FROM inspections 
       WHERE date IS NOT NULL ORDER BY date`
    );
    inspections.forEach(i => {
      events.push({
        id: `inspection-${i.id}`,
        title: i.title,
        type: 'inspection',
        subtype: i.type,
        startDate: i.date,
        status: i.status,
        project: i.project,
        url: `/inspections/${i.id}`,
      });
    });

    const { rows: deadlines } = await pool.query(
      `SELECT id, subject as title, due_date as date, status, project FROM rfis 
       WHERE due_date IS NOT NULL
       UNION ALL
       SELECT id, title, submitted_date as date, status, project FROM change_orders 
       WHERE submitted_date IS NOT NULL`
    );
    deadlines.forEach(d => {
      events.push({
        id: `deadline-${d.id}`,
        title: d.title,
        type: 'deadline',
        subtype: 'Due Date',
        startDate: d.date,
        status: d.status,
        project: d.project,
        url: `/${d.id}`,
      });
    });

    let filtered = events;
    if (start) {
      filtered = filtered.filter(e => !e.startDate || e.startDate >= start);
    }
    if (end) {
      filtered = filtered.filter(e => !e.startDate || e.startDate <= end);
    }

    res.json(filtered);
  } catch (err) {
    console.error('[Calendar Events]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
