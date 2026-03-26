const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Multer config ────────────────────────────────────────────────────────────
const ALLOWED_EXTS = ['.pdf','.doc','.docx','.xls','.xlsx','.png','.jpg','.jpeg','.gif','.webp','.dwg','.dxf','.zip','.rar','.csv'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ─── Format bytes ─────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── GET /api/files ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, project_id, search, type } = req.query;
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    if (project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
    }
    if (search) {
      paramCount++;
      query += ` AND name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }
    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type.toUpperCase());
    }

    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error('[GET /api/files]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/files/upload ───────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const ext      = path.extname(req.file.originalname).replace('.', '').toUpperCase();
    const fileSize = formatSize(req.file.size);
    const name     = req.body.name || req.file.originalname;
    const uploadedBy = req.user?.name || req.user?.email || 'Unknown';
    const category = req.body.category || 'REPORTS';
    const projectId = req.body.project_id || null;
    const filePath = `/uploads/${req.file.filename}`;

    const { rows } = await pool.query(
      `INSERT INTO documents (name, type, project_id, uploaded_by, version, size, status, category, file_path)
       VALUES (, , , , , , , , )
       RETURNING *`,
      [name, ext, projectId, uploadedBy, '1.0', fileSize, 'current', category, filePath]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/files/upload]', err.message);
    if (err.message && err.message.startsWith('File type not allowed')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/files/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    if (category) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /api/files/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/files/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get file path first
    const { rows } = await pool.query('SELECT file_path FROM documents WHERE id = ', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = rows[0].file_path;
    
    // Delete from DB
    await pool.query('DELETE FROM documents WHERE id = ', [id]);

    // Delete physical file
    if (filePath) {
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('[DELETE /api/files/:id]', err.message);
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
