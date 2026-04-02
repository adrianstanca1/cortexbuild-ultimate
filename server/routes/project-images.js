const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');
const authMiddleware = require('../middleware/auth');
const uploadRateLimiter = require('../middleware/uploadRateLimiter');

const router = express.Router();
router.use(authMiddleware);
// Stricter rate limit for uploads: 20 requests per minute (uploads are expensive)
router.use(uploadRateLimiter);

const GALLERY_DIR = path.join(__dirname, '../uploads/gallery');
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });

const ALLOWED_EXTS = new Set(['.png','.jpg','.jpeg','.gif','.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

// Magic numbers for image file validation (prevents extension spoofing)
const MAGIC_NUMBERS = {
  png: '89504e470d0a1a0a',
  jpg: 'ffd8ff',
  jpeg: 'ffd8ff',
  gif: '47494638',
  webp: '52494646', // RIFF header, need to check WEBP at offset 8
};

function getImageTypeFromBuffer(buffer) {
  const hex = buffer.toString('hex').substring(0, 16).toLowerCase();
  if (hex.startsWith(MAGIC_NUMBERS.png)) return 'png';
  if (hex.startsWith(MAGIC_NUMBERS.jpg)) return 'jpg';
  if (hex.startsWith(MAGIC_NUMBERS.gif)) return 'gif';
  // WebP: RIFF....WEBP
  if (hex.startsWith(MAGIC_NUMBERS.webp) && hex.substring(16, 24) === '57454250') return 'webp';
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, GALLERY_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // First check extension
  if (!ALLOWED_EXTS.has(ext)) {
    return cb(new Error(`File extension not allowed: ${ext}`), false);
  }

  // Validate MIME type
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`MIME type not allowed: ${file.mimetype}`), false);
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// ─── GET /api/project-images?project_id=xxx ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    const organizationId = req.user.organization_id;

    let query = 'SELECT * FROM project_images WHERE organization_id = $1';
    const params = [organizationId];
    let paramCount = 1;

    if (project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error('[GET /api/project-images]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/project-images/upload ─────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const projectId = req.body.project_id || null;
    const caption = req.body.caption || '';
    const uploadedBy = req.user?.name || req.user?.email || 'Unknown';
    const imagePath = `/uploads/gallery/${req.file.filename}`;
    const category = req.body.category || 'general';
    const organizationId = req.user.organization_id;

    const { rows } = await pool.query(
      `INSERT INTO project_images (organization_id, project_id, file_path, caption, uploaded_by, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [organizationId, projectId, imagePath, caption, uploadedBy, category]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/project-images/upload]', err.message);
    if (err.message && err.message.startsWith('File type not allowed')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/project-images/:id ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, category } = req.body;
    const organizationId = req.user.organization_id;
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (caption !== undefined) {
      paramCount++;
      updates.push(`caption = $${paramCount}`);
      params.push(caption);
    }
    if (category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id, organizationId);
    const { rows } = await pool.query(
      `UPDATE project_images SET ${updates.join(', ')} WHERE id = $${paramCount + 1} AND organization_id = $${paramCount + 2} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /api/project-images/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/project-images/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organization_id;

    // SECURITY: Filter by organization_id to prevent cross-tenant data access
    const { rows } = await pool.query(
      'SELECT file_path FROM project_images WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const filePath = rows[0].file_path;

    await pool.query('DELETE FROM project_images WHERE id = $1 AND organization_id = $2', [id, organizationId]);

    if (filePath) {
      const fullPath = path.resolve(__dirname, '..', filePath);
      const uploadsDir = path.join(__dirname, '..', 'uploads');
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
    }

    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('[DELETE /api/project-images/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Multer error handler ─────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ message: err.message });
});

module.exports = router;
