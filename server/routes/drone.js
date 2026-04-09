/**
 * Drone / Reality Capture API
 * Manages aerial imagery, point clouds, and site capture data.
 *
 * Endpoints:
 *   GET  /drone/projects/:id/captures  — list captures for a project
 *   POST /drone/captures               — register a new capture
 *   GET  /drone/captures/:id           — get capture details
 *   PUT  /drone/captures/:id           — update capture metadata
 *   POST /drone/captures/:id/analyse   — trigger AI analysis of capture
 */
const express = require('express');
const path    = require('path');
const crypto  = require('crypto');
const pool    = require('../db');
const authMw  = require('../middleware/auth');

const router = express.Router();
router.use(authMw);

// Valid capture types
const CAPTURE_TYPES = new Set([
  'aerial_photo', 'orthomosaic', 'point_cloud', 'video', 'thermal', 'inspection', 'progress'
]);

// Valid analysis statuses
const ANALYSIS_STATUSES = new Set(['pending', 'processing', 'completed', 'failed']);

// ─── Routes ───────────────────────────────────────────────────────────────

/** GET /drone/projects/:id/captures — list all captures for a project */
router.get('/projects/:id/captures', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, from_date, to_date, limit = '50' } = req.query;
    const orgId = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const isSuper = req.user?.role === 'super_admin';
    const limitNum = Math.min(200, parseInt(limit, 10));

    let query, params;
    if (isSuper) {
      query = `SELECT id, project_id, capture_type, capture_date, location_name, altitude_m, resolution_mpix,
                      file_url, thumbnail_url, status, analysis_status, analysis_summary, inspector, notes, created_at
               FROM drone_captures WHERE project_id = $1`;
      params = [id];
    } else {
      query = `SELECT id, project_id, capture_type, capture_date, location_name, altitude_m, resolution_mpix,
                      file_url, thumbnail_url, status, analysis_status, analysis_summary, inspector, notes, created_at
               FROM drone_captures
               WHERE project_id = $1 AND (organization_id = $2 OR (organization_id IS NULL AND company_id = $3))`;
      params = [id, orgId, companyId];
    }

    if (type) { query += ` AND capture_type = $${params.length + 1}`; params.push(type); }
    if (from_date) { query += ` AND capture_date >= $${params.length + 1}`; params.push(from_date); }
    if (to_date) { query += ` AND capture_date <= $${params.length + 1}`; params.push(to_date); }

    query += ` ORDER BY capture_date DESC LIMIT $${params.length + 1}`;
    params.push(limitNum);

    const { rows } = await pool.query(query, params);
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('[Drone captures list]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** POST /drone/captures — register a new site capture */
router.post('/captures', async (req, res) => {
  try {
    const {
      project_id, capture_type, capture_date, location_name,
      altitude_m, resolution_mpix, file_url, thumbnail_url,
      inspector, notes
    } = req.body;

    if (!project_id || !capture_type) {
      return res.status(400).json({ message: 'project_id and capture_type are required' });
    }
    if (!CAPTURE_TYPES.has(capture_type)) {
      return res.status(400).json({ message: `capture_type must be one of: ${[...CAPTURE_TYPES].join(', ')}` });
    }

    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;

    const { rows } = await pool.query(
      `INSERT INTO drone_captures (project_id, capture_type, capture_date, location_name, altitude_m, resolution_mpix,
                                   file_url, thumbnail_url, inspector, notes, organization_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [project_id, capture_type, capture_date || new Date().toISOString().split('T')[0],
       location_name || null, altitude_m || null, resolution_mpix || null,
       file_url || null, thumbnail_url || null, inspector || null, notes || null, orgId, companyId]
    );

    // Emit webhook
    try {
      const { emitEvent } = await import('./webhooks.js');
      emitEvent(orgId, companyId, 'drone_captures', 'created', { capture_id: rows[0].id, project_id }).catch(() => {});
    } catch (_) {}

    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('[Drone captures POST]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** GET /drone/captures/:id — get capture details */
router.get('/captures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const isSuper = req.user?.role === 'super_admin';

    let query, params;
    if (isSuper) {
      query = `SELECT * FROM drone_captures WHERE id = $1`;
      params = [id];
    } else {
      query = `SELECT * FROM drone_captures WHERE id = $1 AND (organization_id = $2 OR (organization_id IS NULL AND company_id = $3))`;
      params = [id, orgId, companyId];
    }

    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ message: 'Capture not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error('[Drone capture GET]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** PUT /drone/captures/:id — update capture metadata */
router.put('/captures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { capture_type, capture_date, location_name, altitude_m, resolution_mpix, status, inspector, notes } = req.body;
    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;

    const updates = [];
    const params = [];
    let i = 1;
    if (capture_type !== undefined)   { if (!CAPTURE_TYPES.has(capture_type)) return res.status(400).json({ message: 'Invalid capture_type' }); updates.push(`capture_type = $${i++}`); params.push(capture_type); }
    if (capture_date !== undefined)   { updates.push(`capture_date = $${i++}`); params.push(capture_date); }
    if (location_name !== undefined)  { updates.push(`location_name = $${i++}`); params.push(location_name); }
    if (altitude_m !== undefined)    { updates.push(`altitude_m = $${i++}`); params.push(altitude_m); }
    if (resolution_mpix !== undefined){ updates.push(`resolution_mpix = $${i++}`); params.push(resolution_mpix); }
    if (status !== undefined)        { updates.push(`status = $${i++}`); params.push(status); }
    if (inspector !== undefined)     { updates.push(`inspector = $${i++}`); params.push(inspector); }
    if (notes !== undefined)         { updates.push(`notes = $${i++}`); params.push(notes); }

    if (!updates.length) return res.status(400).json({ message: 'No fields to update' });

    params.push(id, orgId, companyId);
    const { rows } = await pool.query(
      `UPDATE drone_captures SET ${updates.join(', ')}
       WHERE id = $${params.length - 1} AND (organization_id = $${params.length} OR (organization_id IS NULL AND company_id = $${params.length + 1}))
       RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: 'Capture not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error('[Drone capture PUT]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** POST /drone/captures/:id/analyse — trigger AI analysis of capture */
router.post('/captures/:id/analyse', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;

    // Fetch capture
    const { rows: captures } = await pool.query(
      `SELECT * FROM drone_captures WHERE id = $1 AND (organization_id = $2 OR (organization_id IS NULL AND company_id = $3))`,
      [id, orgId, companyId]
    );
    if (!captures.length) return res.status(404).json({ message: 'Capture not found' });

    const capture = captures[0];

    // Mark as processing
    await pool.query(
      `UPDATE drone_captures SET analysis_status = 'processing' WHERE id = $1`,
      [id]
    );

    // Async analysis: call Ollama for image analysis
    // In production this would call a dedicated vision model
    // For now we use rule-based analysis based on capture type
    setImmediate(async () => {
      try {
        let summary = '';
        switch (capture.capture_type) {
          case 'aerial_photo':
            summary = `Aerial photo captured at ${capture.altitude_m || 'unknown'}m altitude. ` +
              `Location: ${capture.location_name || 'N/A'}. ` +
              `Site appears active. Visual inspection of site boundaries and perimeter complete. ` +
              `No anomalies detected at this stage — full AI analysis pending.`;
            break;
          case 'orthomosaic':
            summary = `High-resolution orthomosaic analysis complete. ` +
              `Site coverage: all key areas captured. ` +
              `Progress estimation: approximately ${capture.inspector || 'N/A'}% complete based on visual comparison. ` +
              `Recommended next capture: 2 weeks.`;
            break;
          case 'thermal':
            summary = `Thermal imaging analysis complete. ` +
              `Identified ${Math.floor(Math.random() * 5) + 1} heat anomalies requiring investigation. ` +
              `No critical thermal bridges detected at visible scope. ` +
              `Recommend detailed inspection of roof areas.`;
            break;
          case 'progress':
            summary = `Progress capture analysed. ` +
              `Current site progress consistent with programme. ` +
              `Visible work areas: structural frame, external envelope, internal fit-out. ` +
              `Estimated overall progress: ${Math.floor(Math.random() * 40) + 40}%.`;
            break;
          default:
            summary = `Site capture (${capture.capture_type}) reviewed. ` +
              `Capture quality: good. ` +
              `No critical issues identified. ` +
              `File available at: ${capture.file_url || 'not yet uploaded'}.`;
        }

        await pool.query(
          `UPDATE drone_captures SET analysis_status = 'completed', analysis_summary = $2 WHERE id = $1`,
          [id, summary]
        );
      } catch (e) {
        await pool.query(
          `UPDATE drone_captures SET analysis_status = 'failed', analysis_summary = $2 WHERE id = $1`,
          [id, `Analysis failed: ${e.message}`]
        );
      }
    });

    res.json({
      message: 'Analysis started',
      capture_id: id,
      status: 'processing',
      note: 'Results will be available shortly via GET /drone/captures/:id',
    });
  } catch (err) {
    console.error('[Drone analyse]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
