const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');

const router = express.Router();

const GALLERY_DIR = path.join(__dirname, '../uploads/gallery');
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });

const ALLOWED_EXTS = ['.png','.jpg','.jpeg','.gif','.webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, GALLERY_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) cb(null, true);
  else cb(new Error(`File type not allowed: ${ext}`), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// ─── GET /api/project-images?project_id=xxx ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    let query = 'SELECT * FROM project_images WHERE 1=1';
    const params = [];
    let paramCount = 0;

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

    const { rows } = await pool.query(
      `INSERT INTO project_images (project_id, file_path, caption, uploaded_by, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, imagePath, caption, uploadedBy, category]
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

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE project_images SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
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

    const { rows } = await pool.query('SELECT file_path FROM project_images WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const filePath = rows[0].file_path;

    await pool.query('DELETE FROM project_images WHERE id = $1', [id]);

    if (filePath) {
      const fullPath = path.join(__dirname, '..', filePath);
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
