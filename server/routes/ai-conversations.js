const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

module.exports = function(io) {

  // GET /api/ai-conversations/:sessionId - Load a session's messages
  router.get('/:sessionId', auth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { rows } = await pool.query(
        `SELECT id, role, content, model, created_at FROM ai_conversations
         WHERE session_id = $1 AND organization_id = $2
         ORDER BY created_at ASC`,
        [sessionId, req.user.organization_id]
      );
      res.json({ messages: rows });
    } catch (err) {
      console.error('Error loading conversation:', err);
      res.status(500).json({ message: 'Failed to load conversation' });
    }
  });

  // POST /api/ai-conversations - Save a message
  router.post('/', auth, async (req, res) => {
    try {
      const { sessionId, role, content, model } = req.body;
      if (!sessionId || !role || !content) {
        return res.status(400).json({ message: 'sessionId, role, and content are required' });
      }
      // Support both snake_case and camelCase for backwards compatibility
      const orgId = req.user.organization_id || req.user.organizationId;
      const userId = req.user.id || req.user.userId;
      const { rows } = await pool.query(
        `INSERT INTO ai_conversations (organization_id, user_id, session_id, role, content, model)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, role, content, model, created_at`,
        [orgId, userId, sessionId, role, content, model || 'qwen3.5']
      );
      res.status(201).json({ message: rows[0] });
    } catch (err) {
      console.error('Error saving message:', err);
      res.status(500).json({ message: 'Failed to save message' });
    }
  });

  // DELETE /api/ai-conversations/:sessionId - Delete a session
  router.delete('/:sessionId', auth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const orgId = req.user.organization_id || req.user.organizationId;
      await pool.query(
        `DELETE FROM ai_conversations WHERE session_id = $1 AND organization_id = $2`,
        [sessionId, orgId]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting conversation:', err);
      res.status(500).json({ message: 'Failed to delete conversation' });
    }
  });

  return router;
};
