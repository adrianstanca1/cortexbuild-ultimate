const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();
router.use(authMiddleware);

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// Multi-tenancy helper: returns tenant filter SQL fragment and params for writes
// For super_admin: no filter (can access all)
// For company_owner: filter by company_id
// For others: filter by organization_id
function tenantFilter(user) {
  if (user?.role === 'super_admin') return { where: '', params: [] };
  if (user?.role === 'company_owner') return { where: 'p.company_id', params: [user.company_id] };
  if (!user?.organization_id) return { where: '0', params: [1] }; // deny access if no org
  return { where: 'p.organization_id', params: [user.organization_id] };
}

// Build JOIN + WHERE clauses for reads (GET)
function orgFilterRead(user) {
  if (user?.role === 'super_admin') return { join: '', filter: '', params: [] };
  if (user?.role === 'company_owner') return {
    join: 'JOIN projects p ON t.project_id = p.id',
    filter: ' AND p.company_id = $1',
    params: [user.company_id],
  };
  if (!user?.organization_id) return { join: '', filter: ' AND 1=0', params: [] }; // deny if no org
  return {
    join: 'JOIN projects p ON t.project_id = p.id',
    filter: ' AND p.organization_id = $1',
    params: [user.organization_id],
  };
}

// ─── GET /api/tasks?projectId=xxx&status=xxx ───────────────────────────────
router.get('/', checkPermission('tasks', 'read'), async (req, res) => {
  try {
    const { projectId, status, priority, assigned_to } = req.query;
    const { join, filter, params } = orgFilterRead(req.user);
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
router.post('/', checkPermission('tasks', 'create'), async (req, res) => {
  try {
    const {
      project_id, title, description, status, priority,
      assigned_to, due_date, category, estimated_hours, tags
    } = req.body;

    const isCompanyOwner = req.user?.role === 'company_owner';
    const tenantCol = isCompanyOwner ? 'company_id' : 'organization_id';
    const tenantId = isCompanyOwner ? req.user.company_id : req.user.organization_id;

    if (!tenantId && req.user?.role !== 'super_admin') {
      return res.status(400).json({ message: 'User profile incomplete. Please complete your profile setup.' });
    }

    if (!title) return res.status(400).json({ message: 'Title is required' });

    // Validate status and priority
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}` });
    }

    // Verify project belongs to user's tenant (IDOR protection)
    if (project_id && req.user?.role !== 'super_admin') {
      const { rows: proj } = await pool.query(
        `SELECT id FROM projects WHERE id = $1 AND ${tenantCol} = $2`,
        [project_id, tenantId]
      );
      if (proj.length === 0) {
        return res.status(403).json({ message: 'Project not found or access denied' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks
        (project_id, title, description, status, priority, assigned_to, due_date, category, estimated_hours, tags, organization_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        tags || '',
        isCompanyOwner ? null : req.user.organization_id,
        req.user.company_id
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/tasks]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── GET /api/tasks/:id ────────────────────────────────────────────────────
router.get('/:id', checkPermission('tasks', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { join, filter, params } = orgFilterRead(req.user);
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
router.put('/:id', checkPermission('tasks', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, status, priority, assigned_to,
      due_date, category, estimated_hours, tags, progress
    } = req.body;

    // Validate status and priority if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}` });
    }

    const tf = tenantFilter(req.user);
    const updates = [];
    const queryParams = [];

    const ALLOWED_FIELDS = ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date', 'category', 'estimated_hours', 'tags', 'progress'];
    const fields = {
      title, description, status, priority, assigned_to,
      due_date, category, estimated_hours, tags, progress
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && ALLOWED_FIELDS.includes(key)) {
        updates.push(`${key} = $${queryParams.length + 1}`);
        queryParams.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    queryParams.push(id);

    // Build WHERE clause dynamically based on role
    let whereClause;
    if (req.user?.role === 'super_admin') {
      whereClause = 't.id = $' + queryParams.length;
    } else {
      whereClause = `p.id = t.project_id AND ${tf.where} = $${queryParams.length + 1} AND t.id = $${queryParams.length}`;
      queryParams.push(...tf.params);
    }

    const { rows } = await pool.query(
      `UPDATE tasks t SET ${updates.join(', ')}
       FROM projects p
       WHERE ${whereClause}
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
router.delete('/:id', checkPermission('tasks', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const tf = tenantFilter(req.user);

    let query, queryParams;
    if (req.user?.role === 'super_admin') {
      query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
      queryParams = [id];
    } else {
      query = `DELETE FROM tasks t USING projects p
               WHERE p.id = t.project_id AND t.id = $1 AND ${tf.where} = $2
               RETURNING t.id`;
      queryParams = [id, ...tf.params];
    }

    const { rows } = await pool.query(query, queryParams);
    if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;