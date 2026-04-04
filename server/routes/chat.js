const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ─── Channels ──────────────────────────────────────────────────────────────

/**
 * GET /api/chat/channels
 * List all chat channels for the organization.
 */
router.get('/channels', async (req, res) => {
  const orgId = req.user?.organization_id;
  const isSuper = ['super_admin', 'company_owner'].includes(req.user?.role);

  try {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(DISTINCT cm.user_id) as member_count
       FROM chat_channels c
       LEFT JOIN chat_channel_members cm ON cm.channel_id = c.id
       WHERE c.organization_id = $1 OR $2 = true
       GROUP BY c.id
       ORDER BY c.name`,
      [orgId, isSuper]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Chat] Failed to list channels:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat/channels
 * Create a new chat channel.
 */
router.post('/channels', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const orgId = req.user?.organization_id;
  const userId = req.user?.id;

  try {
    const { rows } = await pool.query(
      `INSERT INTO chat_channels (name, description, organization_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || '', orgId, userId]
    );

    // Add creator as member
    await pool.query(
      `INSERT INTO chat_channel_members (channel_id, user_id) VALUES ($1, $2)`,
      [rows[0].id, userId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Channel already exists' });
    }
    console.error('[Chat] Failed to create channel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Messages ──────────────────────────────────────────────────────────────

/**
 * GET /api/chat/channels/:channelId/messages
 * List messages for a channel.
 */
router.get('/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const limit = parseInt(req.query.limit || '100', 10);
  const offset = parseInt(req.query.offset || '0', 10);

  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.name as user_name, u.role as user_role
       FROM chat_messages m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.channel_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [channelId, limit, offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Chat] Failed to list messages:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat/channels/:channelId/messages
 * Send a message to a channel.
 */
router.post('/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' });

  const userId = req.user?.id;

  try {
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (channel_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [channelId, userId, content.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Chat] Failed to send message:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/chat/channels/:channelId/messages/:messageId
 * Delete a message (only by author or admin).
 */
router.delete('/channels/:channelId/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?.id;
  const isAdmin = ['super_admin', 'company_owner', 'admin'].includes(req.user?.role);

  try {
    const { rows } = await pool.query(
      `DELETE FROM chat_messages
       WHERE id = $1 AND (user_id = $2 OR $3 = true)
       RETURNING id`,
      [messageId, userId, isAdmin]
    );
    if (!rows.length) return res.status(404).json({ error: 'Message not found or unauthorized' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Chat] Failed to delete message:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/chat/channels/:channelId/messages/:messageId/pin
 * Pin a message.
 */
router.put('/channels/:channelId/messages/:messageId/pin', async (req, res) => {
  const { messageId } = req.params;
  const isAdmin = ['super_admin', 'company_owner', 'admin'].includes(req.user?.role);
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });

  try {
    const { rows } = await pool.query(
      `UPDATE chat_messages SET pinned = true WHERE id = $1 RETURNING *`,
      [messageId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Message not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Chat] Failed to pin message:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
