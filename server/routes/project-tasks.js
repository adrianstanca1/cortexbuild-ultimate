const express = require('express');
const pool    = require('../db');

const router = express.Router();

// ─── GET /api/project-tasks?project_id=xxx&status=todo ───────────────────────
router.get('/', async (req, res) => {
  try {
    const { project_id, status, priority, assigned_to } = req.query;
    let query = 'SELECT * FROM project_tasks WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
    }
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    if (priority) {
      paramCount++;
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
    }
    if (assigned_to) {
      paramCount++;
      query += ` AND assigned_to = $${paramCount}`;
      params.push(assigned_to);
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error('[GET /api/project-tasks]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/project-tasks ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      project_id, title, description, status, priority,
      assigned_to, due_date, category, estimated_hours, tags
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    const { rows } = await pool.query(
      `INSERT INTO project_tasks
        (project_id, title, description, status, priority, assigned_to, due_date, category, estimated_hours, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        project_id || null,
        title,
        description || '',
        status || 'todo',
        priority || 'medium',
        assigned_to || null,
        due_date || null,
        category || 'general',
        estimated_hours || null,
        tags || ''
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/project-tasks]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/project-tasks/:id ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM project_tasks WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    // Get comments
    const { rows: comments } = await pool.query(
      'SELECT * FROM project_task_comments WHERE task_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({ ...rows[0], comments });
  } catch (err) {
    console.error('[GET /api/project-tasks/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/project-tasks/:id ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, status, priority, assigned_to,
      due_date, category, estimated_hours, tags, progress
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    const fields = {
      title, description, status, priority, assigned_to,
      due_date, category, estimated_hours, tags, progress
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE project_tasks SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /api/project-tasks/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/project-tasks/:id ──────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query('SELECT id FROM project_tasks WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    await pool.query('DELETE FROM project_task_comments WHERE task_id = $1', [id]);
    await pool.query('DELETE FROM project_tasks WHERE id = $1', [id]);

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('[DELETE /api/project-tasks/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/project-tasks/:id/comments ───────────────────────────────────
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const author = req.user?.name || req.user?.email || 'Unknown';

    if (!comment) return res.status(400).json({ message: 'Comment is required' });

    // Verify task exists
    const { rows: task } = await pool.query('SELECT id FROM project_tasks WHERE id = $1', [id]);
    if (task.length === 0) return res.status(404).json({ message: 'Task not found' });

    const { rows } = await pool.query(
      `INSERT INTO project_task_comments (task_id, comment, author)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, comment, author]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/project-tasks/:id/comments]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/project-tasks/bulk-status ─────────────────────────────────────
router.put('/bulk-status', async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array is required' });
    }
    if (!status) return res.status(400).json({ message: 'status is required' });

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE project_tasks SET status = $${ids.length + 1} WHERE id IN (${placeholders}) RETURNING *`,
      [...ids, status]
    );

    res.json({ updated: rows.length, data: rows });
  } catch (err) {
    console.error('[PUT /api/project-tasks/bulk-status]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
