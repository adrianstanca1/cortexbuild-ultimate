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
    const { page = '1', pageSize = '50', status, type, severity, category, projectId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClauses = [];
    let params = [userId, orgId];
    let idx = 3;

    // Filter: own notifications OR org-wide (user_id IS NULL)
    whereClauses.push(`(user_id = $1 OR (organization_id = $2 AND user_id IS NULL))`);

    if (status) {
      whereClauses.push(`status = $${idx++}`);
      params.push(status);
    }
    if (type) {
      whereClauses.push(`type = $${idx++}`);
      params.push(type);
    }
    if (severity) {
      whereClauses.push(`severity = $${idx++}`);
      params.push(severity);
    }
    if (projectId) {
      whereClauses.push(`link LIKE $${idx++}`);
      params.push(`%${projectId}%`);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT * FROM notifications ${where}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, parseInt(pageSize), offset]
    );

    const { rows: [{ count: total }] } = await pool.query(
      `SELECT COUNT(*) FROM notifications ${where}`, params
    );

    res.json({ notifications: rows, total: parseInt(total), unreadCount: 0 });
  } catch (err) {
    console.error('[GET /notifications]', err.message);
    res.status(500).json({ message: 'Internal server error' });
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
         AND read = false
         AND (snoozed_until IS NULL OR snoozed_until < NOW())`,
      [userId, orgId]
    );
    res.json({ unreadCount: parseInt(rows[0].count, 10) });
  } catch (err) {
    console.error('[GET /notifications/unread-count]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get notification settings for current user
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { rows } = await pool.query(
      `SELECT * FROM notification_settings WHERE user_id = $1`,
      [userId]
    );
    if (!rows[0]) {
      return res.json({
        soundAlerts: true,
        browserNotifications: false,
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
        categoryPreferences: {}
      });
    }
    res.json({
      soundAlerts: rows[0].sound_alerts,
      browserNotifications: rows[0].browser_notif,
      quietHours: {
        enabled: rows[0].quiet_hours_enabled,
        start: rows[0].quiet_hours_start,
        end: rows[0].quiet_hours_end,
      },
      categoryPreferences: {}
    });
  } catch (err) {
    console.error('[GET /notifications/settings]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update notification settings
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { soundAlerts, browserNotifications, quietHours, categoryPreferences } = req.body;

    const existing = await pool.query(
      `SELECT id FROM notification_settings WHERE user_id = $1 AND category = 'all'`,
      [userId]
    );

    if (existing.rows[0]) {
      await pool.query(
        `UPDATE notification_settings SET
           sound_alerts = COALESCE($1, sound_alerts),
           browser_notif = COALESCE($2, browser_notif),
           quiet_hours_enabled = COALESCE($3, quiet_hours_enabled),
           quiet_hours_start = COALESCE($4, quiet_hours_start),
           quiet_hours_end = COALESCE($5, quiet_hours_end),
           updated_at = NOW()
         WHERE user_id = $6 AND category = 'all'`,
        [
          soundAlerts ?? null,
          browserNotifications ?? null,
          quietHours?.enabled ?? null,
          quietHours?.start ?? null,
          quietHours?.end ?? null,
          userId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO notification_settings (user_id, sound_alerts, browser_notif, quiet_hours_enabled, quiet_hours_start, quiet_hours_end)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          soundAlerts ?? true,
          browserNotifications ?? false,
          quietHours?.enabled ?? false,
          quietHours?.start ?? '22:00',
          quietHours?.end ?? '08:00'
        ]
      );
    }
    res.json({ message: 'Settings updated' });
  } catch (err) {
    console.error('[PUT /notifications/settings]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get notification history (archived)
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { page = '1', pageSize = '50' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR (organization_id = $2 AND user_id IS NULL))
         AND status = 'archived'
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, orgId, parseInt(pageSize), offset]
    );

    res.json({ notifications: rows, total: rows.length });
  } catch (err) {
    console.error('[GET /notifications/history]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark notification as read (must belong to this user/org)
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `UPDATE notifications SET read = true, status = 'read'
       WHERE id = $1 AND (user_id = $2 OR (organization_id = $3 AND user_id IS NULL))
       RETURNING *`,
      [req.params.id, userId, orgId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /notifications/:id/read]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    await pool.query(
      `UPDATE notifications SET read = true, status = 'read'
       WHERE (user_id = $1 OR (organization_id = $2 AND user_id IS NULL))
         AND read = false`,
      [userId, orgId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[PUT /notifications/read-all]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Bulk mark as read
router.post('/mark-read-bulk', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: 'ids array is required' });
    }
    await pool.query(
      `UPDATE notifications SET read = true, status = 'read'
       WHERE id = ANY($1) AND (user_id = $2 OR (organization_id = $3 AND user_id IS NULL))`,
      [ids, userId, orgId]
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('[POST /notifications/mark-read-bulk]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Archive a notification
router.put('/:id/archive', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `UPDATE notifications SET status = 'archived', archived_at = NOW()
       WHERE id = $1 AND (user_id = $2 OR (organization_id = $3 AND user_id IS NULL))
       RETURNING *`,
      [req.params.id, userId, orgId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /notifications/:id/archive]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Archive all read notifications
router.post('/archive-read', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    await pool.query(
      `UPDATE notifications SET status = 'archived', archived_at = NOW()
       WHERE (user_id = $1 OR (organization_id = $2 AND user_id IS NULL))
         AND status = 'read'`,
      [userId, orgId]
    );
    res.json({ message: 'Read notifications archived' });
  } catch (err) {
    console.error('[POST /notifications/archive-read]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Snooze a notification
router.put('/:id/snooze', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { until } = req.body;
    if (!until) return res.status(400).json({ message: 'until timestamp is required' });
    const { rows } = await pool.query(
      `UPDATE notifications SET status = 'snoozed', snoozed_until = $1
       WHERE id = $2 AND (user_id = $3 OR (organization_id = $4 AND user_id IS NULL))
       RETURNING *`,
      [until, req.params.id, userId, orgId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /notifications/:id/snooze]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unsnooze a notification
router.put('/:id/unsnooze', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `UPDATE notifications SET status = 'unread', snoozed_until = NULL
       WHERE id = $1 AND (user_id = $2 OR (organization_id = $3 AND user_id IS NULL))
       RETURNING *`,
      [req.params.id, userId, orgId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT /notifications/:id/unsnooze]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear all notifications for this user (personal only — preserves org broadcasts)
router.delete('/all', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { rows } = await pool.query(
      `DELETE FROM notifications WHERE user_id = $1 AND organization_id = $2 RETURNING id`,
      [userId, orgId]
    );
    res.json({ message: 'All notifications cleared', count: rows.length });
  } catch (err) {
    console.error('[DELETE /notifications/all]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete individual notification
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
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Bulk delete notifications
router.post('/delete-bulk', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: 'ids array is required' });
    }
    const { rows } = await pool.query(
      `DELETE FROM notifications
       WHERE id = ANY($1) AND (user_id = $2 OR (organization_id = $3 AND user_id IS NULL))
       RETURNING id`,
      [ids, userId, orgId]
    );
    res.json({ message: 'Notifications deleted', count: rows.length });
  } catch (err) {
    console.error('[POST /notifications/delete-bulk]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export notifications
router.post('/export', async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.organization_id;
    const { format = 'json' } = req.body;
    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR (organization_id = $2 AND user_id IS NULL))
       ORDER BY created_at DESC`,
      [userId, orgId]
    );
    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {}).join(',');
      const lines = rows.map(r => Object.values(r).join(','));
      res.setHeader('Content-Type', 'text/csv');
      return res.send([headers, ...lines].join('\n'));
    }
    res.json({ notifications: rows, total: rows.length });
  } catch (err) {
    console.error('[POST /notifications/export]', err.message);
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
    res.status(500).json({ message: 'Internal server error' });
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
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
