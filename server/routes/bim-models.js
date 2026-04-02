const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { logAudit } = require('./audit-helper');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/bim');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `bim-${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFormats = ['.ifc', '.obj', '.gltf', '.glb', '.fbx', '.rvt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for BIM files
  }
});

/**
 * GET /api/bim-models - Get all BIM models for current company
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        m.id, m.name, m.description, m.file_name, m.file_path, m.file_size,
        m.format, m.version, m.status, m.elements_count, m.floors_count,
        m.uploaded_by, m.created_at, m.updated_at, m.processed_at,
        u.first_name, u.last_name,
        p.name as project_name
       FROM bim_models m
       LEFT JOIN users u ON m.uploaded_by = u.id
       LEFT JOIN projects p ON m.project_id = p.id
       WHERE m.company_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.company_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('[bim-models GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/bim-models/:id - Get single BIM model with details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        m.*, u.first_name, u.last_name, p.name as project_name
       FROM bim_models m
       LEFT JOIN users u ON m.uploaded_by = u.id
       LEFT JOIN projects p ON m.project_id = p.id
       WHERE m.id = $1 AND m.company_id = $2`,
      [req.params.id, req.user.company_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'BIM model not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[bim-models/:id GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/bim-models - Upload new BIM model
 */
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const { name, description, projectId, format } = req.body;

  if (!name || !format) {
    return res.status(400).json({ message: 'Name and format are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO bim_models (
        organization_id, company_id, project_id, name, description,
        file_name, file_path, file_size, format, uploaded_by, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'processing')
       RETURNING *`,
      [
        req.user.organization_id,
        req.user.company_id,
        projectId || null,
        name,
        description || null,
        req.file.originalname,
        req.file.path,
        req.file.size,
        format.toUpperCase(),
        req.user.id
      ]
    );

    logAudit({
      auth: req.user,
      action: 'create',
      entityType: 'bim_models',
      entityId: rows[0].id,
      newData: { name, file_name: req.file.originalname, format }
    });

    // TODO: Trigger background job to process IFC file and extract elements
    // For now, update status to 'ready' after delay
    setTimeout(async () => {
      await pool.query(
        `UPDATE bim_models SET status = 'ready', processed_at = NOW() WHERE id = $1`,
        [rows[0].id]
      );
    }, 5000);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[bim-models POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/bim-models/:id - Update BIM model metadata
 */
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description, version, status } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE bim_models SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        version = COALESCE($3, version),
        status = COALESCE($4, status),
        updated_at = NOW()
       WHERE id = $5 AND company_id = $6
       RETURNING *`,
      [name, description, version, status, req.params.id, req.user.company_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'BIM model not found' });
    }

    logAudit({
      auth: req.user,
      action: 'update',
      entityType: 'bim_models',
      entityId: req.params.id,
      newData: { name, version, status }
    });

    res.json(rows[0]);
  } catch (err) {
    console.error('[bim-models PUT]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/bim-models/:id - Delete BIM model
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Get file path before deleting
    const fileCheck = await pool.query(
      'SELECT file_path FROM bim_models WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );

    if (!fileCheck.rows.length) {
      return res.status(404).json({ message: 'BIM model not found' });
    }

    const filePath = fileCheck.rows[0].file_path;

    await pool.query('DELETE FROM bim_models WHERE id = $1', [req.params.id]);

    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    logAudit({
      auth: req.user,
      action: 'delete',
      entityType: 'bim_models',
      entityId: req.params.id
    });

    res.json({ message: 'BIM model deleted' });
  } catch (err) {
    console.error('[bim-models DELETE]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/bim-models/:id/clashes - Get clash detections for a model
 */
router.get('/:id/clashes', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        c.*,
        u1.first_name as assigned_to_first,
        u1.last_name as assigned_to_last,
        u2.first_name as resolved_by_first,
        u2.last_name as resolved_by_last
       FROM bim_clashes_detections c
       LEFT JOIN users u1 ON c.assigned_to = u1.id
       LEFT JOIN users u2 ON c.resolved_by = u2.id
       WHERE c.model_id = $1 AND c.organization_id = $2
       ORDER BY 
         CASE c.severity
           WHEN 'critical' THEN 1
           WHEN 'major' THEN 2
           WHEN 'minor' THEN 3
         END,
         c.created_at DESC`,
      [req.params.id, req.user.organization_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('[bim-models/:id/clashes GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/bim-models/:id/clashes - Create clash detection result
 */
router.post('/:id/clashes', authMiddleware, async (req, res) => {
  const {
    clash_type, severity, element_a_name, element_b_name,
    location_x, location_y, location_z, description,
    assigned_to
  } = req.body;

  if (!clash_type || !severity || !description) {
    return res.status(400).json({ message: 'Clash type, severity, and description are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO bim_clashes_detections (
        organization_id, model_id, clash_type, severity,
        element_a_name, element_b_name,
        location_x, location_y, location_z,
        description, assigned_to
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.user.organization_id,
        req.params.id,
        clash_type,
        severity,
        element_a_name || null,
        element_b_name || null,
        location_x || null,
        location_y || null,
        location_z || null,
        description,
        assigned_to || null
      ]
    );

    logAudit({
      auth: req.user,
      action: 'create',
      entityType: 'bim_clashes_detections',
      entityId: rows[0].id,
      newData: { clash_type, severity, description }
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[bim-models/:id/clashes POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/bim-models/:id/clashes/:clashId - Update clash status
 */
router.put('/:id/clashes/:clashId', authMiddleware, async (req, res) => {
  const { status } = req.body;

  if (!status || !['open', 'resolved', 'ignored', 'false_positive'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE bim_clashes_detections SET
        status = $1,
        resolved_by = CASE WHEN $1 = 'resolved' THEN $2 ELSE resolved_by END,
        resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [status, req.user.id, req.params.clashId, req.user.organization_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Clash not found' });
    }

    logAudit({
      auth: req.user,
      action: 'update',
      entityType: 'bim_clashes_detections',
      entityId: req.params.clashId,
      newData: { status }
    });

    res.json(rows[0]);
  } catch (err) {
    console.error('[bim-models/:id/clashes PUT]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/bim-models/:id/layers - Get model layers
 */
router.get('/:id/layers', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bim_model_layers
       WHERE model_id = $1
       ORDER BY layer_name`,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('[bim-models/:id/layers GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
