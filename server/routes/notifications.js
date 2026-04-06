/**
 * CortexBuild Ultimate — Notifications API
 * Store and manage notifications in the database
 * Multi-tenant: all queries scoped to organization_id
 */
const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { createNotification, createAlert, broadcast } = require('../lib/websocket');

const router = express.Router();
router.use(authMiddleware);

// Get notifications for user (user's own + org-wide broadcasts)
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR (organization_id = $2 AND user_id IS NULL))
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId, orgId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /notifications]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE (user_id = $1 OR (organization_id = $2 AND user_id IS NULL))
         AND read = false`,
      [userId, orgId]
    );
    res.json({ count: parseInt(rows[0].count, 10) });
  } catch (err) {
    console.error('[GET /notifications/unread-count]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read (must belong to this user/org)
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `UPDATE notifications SET read = true
       WHERE id = $1 AND (user_id = $2 OR (organization_id = $3 AND user_id IS NULL))
       RETURNING *`,
      [req.params.id, userId, orgId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /notifications/:id/read]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    await pool.query(
      `UPDATE notifications SET read = true
       WHERE (user_id = $1 OR (organization_id = $2 AND user_id IS NULL))
         AND read = false`,
      [userId, orgId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[PUT /notifications/read-all]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rowCount } = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND (user_id = $2 OR (organization_id = $3 AND user_id IS NULL))`,
      [req.params.id, userId, orgId]
    );
    if (!rowCount) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('[DELETE /notifications/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Clear all notifications for this user (personal only — preserves org broadcasts)
router.delete('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    await pool.query(
      `DELETE FROM notifications
       WHERE user_id = $1`,
      [userId]
    );
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    console.error('[DELETE /notifications]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create notification (for system use — requires admin role)
router.post('/', async (req, res) => {
  try {
    const { title, description, severity, type, user_id, link } = req.body;
    const orgId = req.user?.organization_id;
    const companyId = req.user?.company_id;

    const { rows } = await pool.query(
      `INSERT INTO notifications (title, description, severity, type, user_id, link, organization_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, severity || 'info', type || 'notification', user_id || null, link || null, orgId, companyId]
    );

    // Send real-time notification via WebSocket
    if (user_id) {
      createNotification(user_id, title, description, severity || 'info', { link });
    } else {
      // Broadcast to all connected clients in this org
      broadcast({
        type: 'notification',
        payload: { title, description, severity: severity || 'info', link, timestamp: new Date().toISOString() }
      });
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /notifications]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Generate system notifications (periodic checks — admin only)
router.post('/generate-alerts', async (req, res) => {
  try {
    const orgId = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const alerts = [];

    // Check for overdue invoices
    const { rows: overdueInvoices } = await pool.query(
      `SELECT COUNT(*) as count FROM invoices WHERE status = 'overdue' AND organization_id = $1`,
      [orgId]
    );
    if (parseInt(overdueInvoices[0].count, 10) > 0) {
      alerts.push({
        title: 'Overdue Invoices',
        description: `${overdueInvoices[0].count} invoice(s) are overdue`,
        severity: 'warning',
        type: 'alert',
        link: '/invoicing'
      });
    }

    // Check for expiring RAMS (within 30 days)
    const { rows: expiringRams } = await pool.query(
      `SELECT COUNT(*) as count FROM rams WHERE review_date < NOW() + INTERVAL '30 days' AND review_date > NOW() AND organization_id = $1`,
      [orgId]
    );
    if (parseInt(expiringRams[0].count, 10) > 0) {
      alerts.push({
        title: 'RAMS Expiring Soon',
        description: `${expiringRams[0].count} RAMS document(s) expiring within 30 days`,
        severity: 'warning',
        type: 'alert',
        link: '/rams'
      });
    }

    // Check for open safety incidents
    const { rows: openIncidents } = await pool.query(
      `SELECT COUNT(*) as count FROM safety_incidents WHERE status IN ('open', 'investigating') AND organization_id = $1`,
      [orgId]
    );
    if (parseInt(openIncidents[0].count, 10) > 0) {
      alerts.push({
        title: 'Open Safety Incidents',
        description: `${openIncidents[0].count} safety incident(s) require attention`,
        severity: 'critical',
        type: 'alert',
        link: '/safety'
      });
    }

    // Save and broadcast alerts
    for (const alert of alerts) {
      await pool.query(
        `INSERT INTO notifications (title, description, severity, type, link, organization_id, company_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [alert.title, alert.description, alert.severity, alert.type, alert.link, orgId, companyId]
      );
    }

    for (const alert of alerts) {
      broadcast({
        type: 'alert',
        payload: { ...alert, timestamp: new Date().toISOString() }
      });
    }

    res.json({ generated: alerts.length, alerts });
  } catch (err) {
    console.error('[POST /notifications/generate-alerts]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
