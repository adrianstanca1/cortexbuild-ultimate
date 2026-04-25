const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { logAudit } = require('./audit-helper');

const router = express.Router();

router.use(authMiddleware);

function safeFloat(val, fallback = null) {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseFloat(val);
  return Number.isNaN(n) ? fallback : n;
}

function safeFloatZero(val) {
  return safeFloat(val, 0);
}

// ─── Ensure tables exist ───────────────────────────────────────────────────────
(async function initTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS measurements (
        id SERIAL PRIMARY KEY,
        project_id INTEGER,
        reference TEXT,
        item_no TEXT,
        survey_type TEXT,
        location TEXT,
        surveyor TEXT,
        measurement_date DATE,
        quantity NUMERIC(12,2),
        unit TEXT,
        rate NUMERIC(12,2),
        total NUMERIC(12,2),
        status TEXT DEFAULT 'draft',
        notes TEXT,
        organization_id INTEGER,
        company_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS valuations (
        id SERIAL PRIMARY KEY,
        project_id INTEGER,
        period TEXT,
        amount_certified NUMERIC(12,2),
        cumulative_total NUMERIC(12,2),
        retention_deducted NUMERIC(12,2),
        net_payment NUMERIC(12,2),
        status TEXT DEFAULT 'draft',
        organization_id INTEGER,
        company_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[measuring] Tables ensured');
  } catch (err) {
    console.error('[measuring] Failed to ensure tables:', err.message);
  }
})();

// ═══════════════════════════════════════════════════════════════════════════════
// Measurements
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/measurements ───────────────────────────────────────────────────
router.get('/measurements', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, p.name as project_name
       FROM measurements m
       LEFT JOIN projects p ON m.project_id = p.id
       WHERE COALESCE(m.organization_id, m.company_id) = $1
       ORDER BY m.updated_at DESC`,
      [req.user.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[measurements GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/measurements ────────────────────────────────────────────────────
router.post('/measurements', async (req, res) => {
  const {
    project_id, reference, item_no, survey_type, location,
    surveyor, measurement_date, quantity, unit, rate, total,
    status, notes
  } = req.body;

  const quantityVal = safeFloat(quantity);
  const rateVal = safeFloat(rate);
  const totalVal = safeFloat(total);

  if ((quantityVal !== null && quantityVal < 0) ||
      (rateVal !== null && rateVal < 0) ||
      (totalVal !== null && totalVal < 0)) {
    return res.status(400).json({ message: 'Numeric values cannot be negative' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO measurements (
        project_id, reference, item_no, survey_type, location,
        surveyor, measurement_date, quantity, unit, rate, total,
        status, notes, organization_id, company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        project_id || null,
        reference || null,
        item_no || null,
        survey_type || null,
        location || null,
        surveyor || null,
        measurement_date || null,
        quantityVal,
        unit || null,
        rateVal,
        totalVal,
        status || 'draft',
        notes || null,
        req.user.organization_id,
        req.user.company_id
      ]
    );

    logAudit({
      auth: req.user,
      action: 'create',
      entityType: 'measurements',
      entityId: rows[0].id,
      newData: rows[0]
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[measurements POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/measurements/:id ─────────────────────────────────────────────────
router.get('/measurements/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, p.name as project_name
       FROM measurements m
       LEFT JOIN projects p ON m.project_id = p.id
       WHERE m.id = $1 AND COALESCE(m.organization_id, m.company_id) = $2`,
      [req.params.id, req.user.company_id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Measurement not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[measurements GET :id]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/measurements/:id ─────────────────────────────────────────────────
router.put('/measurements/:id', async (req, res) => {
  const {
    project_id, reference, item_no, survey_type, location,
    surveyor, measurement_date, quantity, unit, rate, total,
    status, notes
  } = req.body;

  const quantityVal = safeFloat(quantity);
  const rateVal = safeFloat(rate);
  const totalVal = safeFloat(total);

  if ((quantityVal !== null && quantityVal < 0) ||
      (rateVal !== null && rateVal < 0) ||
      (totalVal !== null && totalVal < 0)) {
    return res.status(400).json({ message: 'Numeric values cannot be negative' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE measurements SET
        project_id = COALESCE($1, project_id),
        reference = COALESCE($2, reference),
        item_no = COALESCE($3, item_no),
        survey_type = COALESCE($4, survey_type),
        location = COALESCE($5, location),
        surveyor = COALESCE($6, surveyor),
        measurement_date = COALESCE($7, measurement_date),
        quantity = COALESCE($8, quantity),
        unit = COALESCE($9, unit),
        rate = COALESCE($10, rate),
        total = COALESCE($11, total),
        status = COALESCE($12, status),
        notes = COALESCE($13, notes),
        updated_at = NOW()
       WHERE id = $14 AND COALESCE(organization_id, company_id) = $15
       RETURNING *`,
      [
        project_id, reference, item_no, survey_type, location,
        surveyor, measurement_date, quantityVal, unit, rateVal, totalVal,
        status, notes,
        req.params.id, req.user.company_id
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    logAudit({
      auth: req.user,
      action: 'update',
      entityType: 'measurements',
      entityId: req.params.id,
      newData: rows[0]
    });

    res.json(rows[0]);
  } catch (err) {
    console.error('[measurements PUT]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE /api/measurements/:id ────────────────────────────────────────────
router.delete('/measurements/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM measurements
       WHERE id = $1 AND COALESCE(organization_id, company_id) = $2`,
      [req.params.id, req.user.company_id]
    );
    if (!rowCount) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    logAudit({
      auth: req.user,
      action: 'delete',
      entityType: 'measurements',
      entityId: req.params.id
    });

    res.json({ message: 'Measurement deleted' });
  } catch (err) {
    console.error('[measurements DELETE]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Valuations
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/valuations ─────────────────────────────────────────────────────
router.get('/valuations', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, p.name as project_name
       FROM valuations v
       LEFT JOIN projects p ON v.project_id = p.id
       WHERE COALESCE(v.organization_id, v.company_id) = $1
       ORDER BY v.updated_at DESC`,
      [req.user.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[valuations GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/valuations ──────────────────────────────────────────────────────
router.post('/valuations', async (req, res) => {
  const {
    project_id, period, amount_certified, cumulative_total,
    retention_deducted, net_payment, status
  } = req.body;

  const amountCertifiedVal = safeFloat(amount_certified);
  const cumulativeTotalVal = safeFloat(cumulative_total);
  const retentionDeductedVal = safeFloat(retention_deducted);
  const netPaymentVal = safeFloat(net_payment);

  if ((amountCertifiedVal !== null && amountCertifiedVal < 0) ||
      (cumulativeTotalVal !== null && cumulativeTotalVal < 0) ||
      (retentionDeductedVal !== null && retentionDeductedVal < 0) ||
      (netPaymentVal !== null && netPaymentVal < 0)) {
    return res.status(400).json({ message: 'Financial amounts cannot be negative' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO valuations (
        project_id, period, amount_certified, cumulative_total,
        retention_deducted, net_payment, status,
        organization_id, company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        project_id || null,
        period || null,
        amountCertifiedVal,
        cumulativeTotalVal,
        retentionDeductedVal,
        netPaymentVal,
        status || 'draft',
        req.user.organization_id,
        req.user.company_id
      ]
    );

    logAudit({
      auth: req.user,
      action: 'create',
      entityType: 'valuations',
      entityId: rows[0].id,
      newData: rows[0]
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[valuations POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/valuations/:id ───────────────────────────────────────────────────
router.get('/valuations/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, p.name as project_name
       FROM valuations v
       LEFT JOIN projects p ON v.project_id = p.id
       WHERE v.id = $1 AND COALESCE(v.organization_id, v.company_id) = $2`,
      [req.params.id, req.user.company_id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Valuation not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[valuations GET :id]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/valuations/:id ─────────────────────────────────────────────────
router.put('/valuations/:id', async (req, res) => {
  const {
    project_id, period, amount_certified, cumulative_total,
    retention_deducted, net_payment, status
  } = req.body;

  const amountCertifiedVal = safeFloat(amount_certified);
  const cumulativeTotalVal = safeFloat(cumulative_total);
  const retentionDeductedVal = safeFloat(retention_deducted);
  const netPaymentVal = safeFloat(net_payment);

  if ((amountCertifiedVal !== null && amountCertifiedVal < 0) ||
      (cumulativeTotalVal !== null && cumulativeTotalVal < 0) ||
      (retentionDeductedVal !== null && retentionDeductedVal < 0) ||
      (netPaymentVal !== null && netPaymentVal < 0)) {
    return res.status(400).json({ message: 'Financial amounts cannot be negative' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE valuations SET
        project_id = COALESCE($1, project_id),
        period = COALESCE($2, period),
        amount_certified = COALESCE($3, amount_certified),
        cumulative_total = COALESCE($4, cumulative_total),
        retention_deducted = COALESCE($5, retention_deducted),
        net_payment = COALESCE($6, net_payment),
        status = COALESCE($7, status),
        updated_at = NOW()
       WHERE id = $8 AND COALESCE(organization_id, company_id) = $9
       RETURNING *`,
      [
        project_id, period,
        amountCertifiedVal, cumulativeTotalVal,
        retentionDeductedVal, netPaymentVal,
        status,
        req.params.id, req.user.company_id
      ]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Valuation not found' });
    }

    logAudit({
      auth: req.user,
      action: 'update',
      entityType: 'valuations',
      entityId: req.params.id,
      newData: rows[0]
    });

    res.json(rows[0]);
  } catch (err) {
    console.error('[valuations PUT]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE /api/valuations/:id ────────────────────────────────────────────────
router.delete('/valuations/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM valuations
       WHERE id = $1 AND COALESCE(organization_id, company_id) = $2`,
      [req.params.id, req.user.company_id]
    );
    if (!rowCount) {
      return res.status(404).json({ message: 'Valuation not found' });
    }

    logAudit({
      auth: req.user,
      action: 'delete',
      entityType: 'valuations',
      entityId: req.params.id
    });

    res.json({ message: 'Valuation deleted' });
  } catch (err) {
    console.error('[valuations DELETE]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
