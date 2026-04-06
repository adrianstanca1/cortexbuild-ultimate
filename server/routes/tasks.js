const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// /api/tasks is an alias for /api/project-tasks with projectId query param
// Multi-tenancy: filter through project join
async function orgFilterTasks(user) {
  if (!user?.organization_id) return { join: '', filter: '', params: [] };
  return {
    join: 'JOIN projects p ON t.project_id = p.id',
    filter: ' AND p.organization_id = $1',
    params: [user.organization_id],
  };
}

// ─── GET /api/tasks?projectId=xxx&status=xxx ───────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { projectId, status, priority, assigned_to } = req.query;
    const { join, filter, params } = await orgFilterTasks(req.user);
    const queryParams = [...params];

    let query = `SELECT t.* FROM tasks t ${join} WHERE 1=1${filter}`;

    if (projectId) {
      queryParams.push(projectId);
      query += ` AND t.project_id = $${queryParams.length}`;
    }
    if (status) {
      queryParams.push(status);
      query += ` AND t.status = $${queryParams.length}`;
    }
    if (priority) {
      queryParams.push(priority);
      query += ` AND t.priority = $${queryParams.length}`;
    }
    if (assigned_to) {
      queryParams.push(assigned_to);
      query += ` AND t.assigned_to = $${queryParams.length}`;
    }

    query += ' ORDER BY t.created_at DESC';
    const { rows } = await pool.query(query, queryParams);
    res.json({ data: rows });
  } catch (err) {
    console.error('[GET /api/tasks]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── POST /api/tasks ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      project_id, title, description, status, priority,
      assigned_to, due_date, category, estimated_hours, tags
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    // Verify project belongs to user's org
    if (project_id && req.user?.organization_id) {
      const { rows: proj } = await pool.query(
        'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
        [project_id, req.user.organization_id]
      );
      if (proj.length === 0) {
        return res.status(403).json({ message: 'Project not found or access denied' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks
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
    console.error('[POST /api/tasks]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── GET /api/tasks/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { join, filter, params } = await orgFilterTasks(req.user);
    const { rows } = await pool.query(
      `SELECT t.* FROM tasks t ${join} WHERE t.id = $${params.length + 1}${filter}`,
      [...params, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('[GET /api/tasks/:id]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── PUT /api/tasks/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, status, priority, assigned_to,
      due_date, category, estimated_hours, tags, progress
    } = req.body;

    const { params: baseParams } = await orgFilterTasks(req.user);
    // Build query params: org first ($1), then update values, then id last
    const queryParams = [...baseParams];
    const updates = [];

    const fields = {
      title, description, status, priority, assigned_to,
      due_date, category, estimated_hours, tags, progress
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${queryParams.length + 1}`);
        queryParams.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const idParamIndex = queryParams.length + 1;
    queryParams.push(id);

    const { rows } = await pool.query(
      `UPDATE tasks t SET ${updates.join(', ')}
       FROM projects p
       WHERE p.id = t.project_id AND p.organization_id = $1 AND t.id = $${idParamIndex}
       RETURNING t.*`,
      queryParams
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /api/tasks/:id]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── DELETE /api/tasks/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { params: baseParams } = await orgFilterTasks(req.user);

    // id goes first ($1), then org params follow
    const queryParams = [id, ...baseParams];
    const orgIdParamIndex = queryParams.length;

    const { rows } = await pool.query(
      `DELETE FROM tasks t USING projects p
       WHERE p.id = t.project_id AND t.id = $1 AND p.organization_id = $${orgIdParamIndex}
       RETURNING t.id`,
      queryParams
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
