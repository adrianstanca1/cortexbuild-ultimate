const express = require('express');
const webpush = require('web-push');
const router = express.Router();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@cortexbuildpro.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// In-memory store (replace with DB column in production)
const subscriptions = new Map(); // userId → PushSubscription

// TODO(ios): APNs device tokens need a persistent store (DB table) and
// a server-side APNs sender (node-apn package). In-memory store is
// lost on server restart — devices re-register on next app foreground.

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

// POST /subscribe-native — store APNs device token from iOS Capacitor app
router.post('/subscribe-native', async (req, res) => {
  const { deviceToken, platform } = req.body;
  if (!deviceToken || platform !== 'apns') {
    return res.status(400).json({ error: 'deviceToken and platform=apns required' });
  }
  const APNS_TOKEN_RE = /^[0-9a-f]{64}$/i;
  if (!APNS_TOKEN_RE.test(deviceToken)) {
    return res.status(400).json({ error: 'Invalid APNs token format' });
  }
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  subscriptions.set(`apns:${userId}`, { deviceToken, platform: 'apns', userId });
  console.log(`[Push] APNs device token registered for user ${userId}`);
  res.status(204).end();
});

// GET /api/push/vapid-public-key — return VAPID public key for client
router.get('/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || '' });
});

// Internal helper — send push notification to a specific user by id
router.sendToUser = async (userId, payload) => {
  const sub = subscriptions.get(userId);
  if (!sub) return;
  if (sub.platform === 'apns') {
    // TODO(ios): route APNs tokens through node-apn / @parse/node-apn
    // For now, log and skip so web-push doesn't throw on native subscribers
    console.info(`[Push] APNs token registered for user ${userId} — server-side APNs delivery not yet implemented`);
    return;
  }
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410) {
      subscriptions.delete(userId); // subscription expired/unsubscribed
    } else {
      console.error('[Push] sendToUser error:', err.message);
    }
  }
};

// Internal helper — broadcast to all subscribers (optionally filter by role/project in future)
router.sendToRole = async (_role, _projectId, payload) => {
  for (const [, sub] of subscriptions) {
    if (sub.platform === 'apns') {
      // Skip APNs subscribers — server-side APNs delivery not yet implemented
      continue;
    }
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch {
      // ignore individual send errors during broadcast
    }
  }
};

module.exports = router;
