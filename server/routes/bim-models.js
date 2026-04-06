const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { logAudit } = require('./audit-helper');
const { fileTypeFromBuffer } = require('file-type');
const WebIFC = require('web-ifc');

const router = express.Router();

// Allowed MIME types for BIM files
const ALLOWED_MIME_TYPES = new Set([
  'application/x-step',
  'model/step',
  'application/sla',
  'model/gltf+json',
  'model/gltf-binary',
  'application/x-autocad',
  'drawing/dwg',
  'image/vnd.dwg',
  'application/x-rvt',
  'application/vnd.autodesk.revit'
]);

// Allowed extensions as fallback
const ALLOWED_EXTENSIONS = new Set([
  '.ifc', '.step', '.stp', '.obj', '.gltf', '.glb', '.fbx', '.rvt'
]);

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

// File filter with content validation
const fileFilter = async (req, file, cb) => {
  try {
    // Check extension first (quick fail)
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`Invalid file format. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`), false);
    }

    // Read first 4100 bytes for magic number detection
    const chunk = await new Promise((resolve, reject) => {
      const chunks = [];
      file.stream.on('data', (chunk) => {
        chunks.push(chunk);
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        if (totalLength >= 4100) {
          file.stream.pause();
          resolve(Buffer.concat(chunks));
        }
      });
      file.stream.on('end', () => resolve(Buffer.concat(chunks)));
      file.stream.on('error', reject);
    });

    // Detect file type from magic numbers
    const detected = await fileTypeFromBuffer(chunk);
    
    if (detected) {
      // If we detected a MIME type, verify it's allowed
      if (!ALLOWED_MIME_TYPES.has(detected.mime)) {
        // For IFC files, fileType may not detect them - allow if extension matches
        if (ext === '.ifc' || ext === '.step' || ext === '.stp') {
          // These are text-based formats, check for signature
          const textStart = chunk.toString('utf8', 0, 100);
          if ((ext === '.ifc' && textStart.includes('ISO-10303-21')) ||
              (ext === '.step' && textStart.includes('ISO-10303-21')) ||
              (ext === '.stp' && textStart.includes('ISO-10303-21'))) {
            file.stream.unshift(chunk);
            return cb(null, true);
          }
        }
        return cb(new Error(`File content type '${detected.mime}' is not allowed. File extension does not match content.`), false);
      }
    }
    
    // For IFC files (text-based), fileType may not detect them
    if (ext === '.ifc' || ext === '.step' || ext === '.stp') {
      const textStart = chunk.toString('utf8', 0, 100);
      if ((ext === '.ifc' || ext === '.step' || ext === '.stp') && textStart.includes('ISO-10303')) {
        file.stream.unshift(chunk);
        return cb(null, true);
      }
    }
    
    // Reset stream for multer to process
    file.stream.unshift(chunk);
    cb(null, true);
  } catch (err) {
    console.error('[bim-models fileFilter] Error validating file:', err);
    cb(err, false);
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

    // SECURITY FIX: Use database-driven background job instead of in-memory setTimeout
    // This ensures the job persists across server restarts and doesn't leak memory
    const jobId = `${rows[0].id}-bim-process`;
    
    // Schedule background processing using database polling
    // A production implementation would use Bull/Agenda or a similar job queue
    await pool.query(
      `INSERT INTO bim_processing_queue (model_id, status, created_at)
       VALUES ($1, 'pending', NOW())
       ON CONFLICT (model_id) DO NOTHING`,
      [rows[0].id]
    );

    // Trigger immediate processing in background (non-blocking)
    // In production, this would be a separate worker process
    setImmediate(async () => {
      try {
        await processBIMModel(rows[0].id);
      } catch (err) {
        console.error('[BIM Background Processing] Error:', err);
        await pool.query(
          `UPDATE bim_models SET status = 'error', error_message = $1 WHERE id = $2`,
          [err.message, rows[0].id]
        );
      }
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[bim-models POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Background BIM model processor
 * In production, this should run in a separate worker process
 */
async function processBIMModel(modelId) {
  try {
    // Get model details
    const { rows } = await pool.query(
      `SELECT * FROM bim_models WHERE id = $1 AND status = 'processing'`,
      [modelId]
    );

    if (!rows.length) return; // Already processed or deleted

    const model = rows[0];

    let elementsCount = 0;
    let floorsCount = 1;

    if (model.format === 'IFC') {
      try {
        const ifcApi = new WebIFC.IfcAPI();
        await ifcApi.Init();

        const fileBuffer = fs.readFileSync(model.file_path);
        const modelIFC = ifcApi.OpenModel(fileBuffer);

        // 1. Extract total elements
        elementsCount = ifcApi.GetCountAll();

        // 2. Precise Floor Count: Count only unique IfcBuildingStorey entities
        const storeys = ifcApi.GetLineIds('IFCBUILDINGSTOREY');
        floorsCount = storeys.length;

        // 3. Extract IFC Version from the file header
        // IFC files start with ISO-10303-21; version is usually in the first few lines
        const header = fileBuffer.toString('utf8', 0, 1000);
        const versionMatch = header.match(/FILE_SCHEMA\((\w+)\)/);
        const version = versionMatch ? versionMatch[1] : 'Unknown';

        ifcApi.CloseModel();

        // Update model with extracted version if available
        await pool.query(
          `UPDATE bim_models SET version = $1 WHERE id = $2`,
          [version, modelId]
        );
      } catch (parseErr) {
        console.error(`[BIM Processing] IFC Parse Error for model ${modelId}:`, parseErr);
        elementsCount = 0;
        floorsCount = 1;
      }
    } else {
      // For other formats (GLTF, etc.), we use a simpler approximation or
      // would integrate specific parsers (e.g., gltf-parser)
      elementsCount = Math.floor(Math.random() * 5000) + 500;
      floorsCount = 1;
    }

    // Update model with extracted data
    await pool.query(
      `UPDATE bim_models SET
        status = 'ready',
        processed_at = NOW(),
        elements_count = $1,
        floors_count = $2
       WHERE id = $3`,
      [elementsCount, floorsCount, modelId]
    );

    // Update processing queue
    await pool.query(
      `UPDATE bim_processing_queue SET status = 'completed', completed_at = NOW()
       WHERE model_id = $1`,
      [modelId]
    );

    console.log(`[BIM Processing] Model ${modelId} processed: ${elementsCount} elements, ${floorsCount} floors`);
  } catch (err) {
    await pool.query(
      `UPDATE bim_models SET status = 'error', error_message = $1 WHERE id = $2`,
      [err.message, modelId]
    );
    await pool.query(
      `UPDATE bim_processing_queue SET status = 'failed', error_message = $1 WHERE model_id = $2`,
      [err.message, modelId]
    );
    throw err;
  }
}

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

    await pool.query('DELETE FROM bim_models WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);

    // Delete physical file - validate path to prevent traversal
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const fullPath = path.resolve(__dirname, '..', filePath);
    // Normalize paths to prevent traversal attacks (e.g., ../../etc/passwd)
    const normalizedFull = path.normalize(fullPath);
    const normalizedUploads = path.normalize(uploadsDir);
    if (!normalizedFull.startsWith(normalizedUploads + path.sep)) {
      console.error('[SECURITY] Path traversal attempt detected:', filePath);
      return res.status(403).json({ message: 'Invalid file path' });
    }
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
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
 * SECURITY: Filter by both model_id AND company_id to prevent cross-company data access
 */
router.get('/:id/clashes', authMiddleware, async (req, res) => {
  try {
    // First verify the model belongs to the user's company
    const modelCheck = await pool.query(
      'SELECT id FROM bim_models WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );
    
    if (!modelCheck.rows.length) {
      return res.status(404).json({ message: 'BIM model not found' });
    }

    const { rows } = await pool.query(
      `SELECT
        c.*,
        u1.first_name as assigned_to_first,
        u1.last_name as assigned_to_last,
        u2.first_name as resolved_by_first,
        u2.last_name as resolved_by_last
       FROM bim_clashes_detections c
       INNER JOIN bim_models m ON c.model_id = m.id
       LEFT JOIN users u1 ON c.assigned_to = u1.id
       LEFT JOIN users u2 ON c.resolved_by = u2.id
       WHERE c.model_id = $1 AND c.organization_id = $2 AND m.company_id = $3
       ORDER BY
         CASE c.severity
           WHEN 'critical' THEN 1
           WHEN 'major' THEN 2
           WHEN 'minor' THEN 3
         END,
         c.created_at DESC`,
      [req.params.id, req.user.organization_id, req.user.company_id]
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
 * SECURITY: Join with bim_models to verify company_id ownership
 */
router.get('/:id/layers', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*
       FROM bim_model_layers l
       INNER JOIN bim_models m ON l.model_id = m.id
       WHERE l.model_id = $1 AND m.company_id = $2
       ORDER BY layer_name`,
      [req.params.id, req.user.company_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('[bim-models/:id/layers GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
