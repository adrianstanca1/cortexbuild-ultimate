const express = require('express');
const multer  = require('multer');
const path    = require('path');
const pool    = require('../db');

const router = express.Router();

// ─── Multer config ────────────────────────────────────────────────────────────
const ALLOWED_EXTS = ['.pdf','.doc','.docx','.xls','.xlsx','.png','.jpg','.jpeg','.dwg','.zip'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── Format bytes ─────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── POST /api/upload ─────────────────────────────────────────────────────────
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const ext      = path.extname(req.file.originalname).replace('.', '').toUpperCase();
    const fileSize = formatSize(req.file.size);
    const name     = req.file.originalname;
    const uploadedBy = req.user?.name || req.user?.email || 'Unknown';
    const category = req.body.category || 'REPORTS';
    const project  = req.body.project  || null;
    const projectId = req.body.project_id || null;

    const { rows } = await pool.query(
      `INSERT INTO documents (name, type, project_id, project, uploaded_by, version, size, status, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, ext, projectId, project, uploadedBy, '1.0', fileSize, 'current', category]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /api/upload]', err.message);
    // multer file-type error comes through here when fileFilter calls cb(err)
    if (err.message && err.message.startsWith('File type not allowed')) {
      return res.status(400).json({ message: err.message });
    }
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
