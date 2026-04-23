const express = require('express');
const webpush = require('web-push');
const router = express.Router();

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@cortexbuildpro.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// In-memory store (replace with DB column in production)
const subscriptions = new Map(); // userId → PushSubscription

// POST /api/push/subscribe — store client push subscription
// Note: /api/push is mounted after the global authMiddleware at line 125,
// so req.user is already populated by the time these handlers run.
router.post('/subscribe', (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  const userId = req.user?.id || 'anonymous';
  subscriptions.set(userId, subscription);
  res.json({ ok: true });
});

// GET /api/push/vapid-public-key — return VAPID public key for client
router.get('/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || '' });
});

// Internal helper — send push notification to a specific user by id
router.sendToUser = async (userId, payload) => {
  const sub = subscriptions.get(userId);
  if (!sub) return;
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410) {
      subscriptions.delete(userId); // subscription expired/unsubscribed
    }
  }
};

// Internal helper — broadcast to all subscribers (optionally filter by role/project in future)
router.sendToRole = async (_role, _projectId, payload) => {
  for (const [, sub] of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch {
      // ignore individual send errors during broadcast
    }
  }
};

module.exports = router;
