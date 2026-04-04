/**
 * CortexBuild Ultimate — Notifications API
 * Store and manage notifications in the database
 */
const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { createNotification, createAlert } = require('../lib/websocket');

const router = express.Router();
router.use(authMiddleware);

// Get notifications for user
router.get('/', async (req, res) => {
  try {
    const orgId = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const { rows } = await pool.query(
      `SELECT * FROM notifications 
       WHERE (organization_id = $1 OR company_id = $2 OR organization_id IS NULL)
       ORDER BY created_at DESC 
       LIMIT 100`,
      [orgId, companyId]
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
    const orgId = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE (organization_id = $1 OR company_id = $2 OR organization_id IS NULL) AND read = false`,
      [orgId, companyId]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    console.error('[GET /notifications/unread-count]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications SET read = true WHERE id = $1 RETURNING *`,
      [req.params.id]
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
    await pool.query(
      `UPDATE notifications SET read = true WHERE (user_id = $1 OR user_id IS NULL) AND read = false`,
      [userId]
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
    const { rowCount } = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('[DELETE /notifications/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Clear all notifications
router.delete('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    await pool.query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [userId]
    );
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    console.error('[DELETE /notifications]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Create notification (for system use)
router.post('/', async (req, res) => {
  try {
    const { title, description, severity, type, user_id, link } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO notifications (title, description, severity, type, user_id, link, organization_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, severity || 'info', type || 'notification', user_id, link, req.user.organization_id, req.user.company_id]
    );
    
    // Send real-time notification via WebSocket
    if (user_id) {
      createNotification(user_id, title, description, severity, { link });
    } else {
      // Broadcast to all connected clients
      const { broadcast } = require('../lib/websocket');
      broadcast({
        type: 'notification',
        payload: { title, description, severity, link, timestamp: new Date().toISOString() }
      });
    }
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /notifications]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Generate system notifications (periodic checks)
router.post('/generate-alerts', async (req, res) => {
  try {
    const alerts = [];
    
    // Check for overdue invoices
    const { rows: overdueInvoices } = await pool.query(
      `SELECT COUNT(*) as count FROM invoices WHERE status = 'overdue'`
    );
    if (parseInt(overdueInvoices[0].count) > 0) {
      alerts.push({
        title: 'Overdue Invoices',
        description: `${overdueInvoices[0].count} invoice(s) are overdue`,
        severity: 'warning',
        type: 'alert',
        link: '/invoicing'
      });
    }
    
    // Check for expiring RAMS
    const { rows: expiringRams } = await pool.query(
      `SELECT COUNT(*) as count FROM rams WHERE review_date < NOW() + INTERVAL '30 days'`
    );
    if (parseInt(expiringRams[0].count) > 0) {
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
      `SELECT COUNT(*) as count FROM safety_incidents WHERE status IN ('open', 'investigating')`
    );
    if (parseInt(openIncidents[0].count) > 0) {
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
        `INSERT INTO notifications (title, description, severity, type, link)
         VALUES ($1, $2, $3, $4, $5)`,
        [alert.title, alert.description, alert.severity, alert.type, alert.link]
      );
    }
    
    // Broadcast all alerts
    const { broadcast } = require('../lib/websocket');
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
