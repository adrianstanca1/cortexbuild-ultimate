const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const rateLimit = require('express-rate-limit');
const pool    = require('../db');
const authMiddleware = require('../middleware/auth');
const { logAudit } = require('./audit-helper');
const { insertOrgAndCompany } = require('../lib/bootstrap-tenant');
const { blacklistToken, revokeAllUserTokens } = require('../lib/tokenBlacklist');

const router = express.Router();
// SECURITY: JWT_SECRET MUST be set in environment — no hardcoded fallback
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error('[SECURITY] JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// ─── Auth-specific rate limiters ───────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 failed attempts per window
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                  // 5 registrations per hour per IP
  message: { message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const VALID_ROLES = ['super_admin','company_owner','admin','project_manager','field_worker','client'];

// POST /api/auth/register — public self-registration (creates company_owner account)
// Rate limited to prevent abuse
router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password, company, phone } = req.body;

  if (!name || !email || !password || !company) {
    return res.status(400).json({ message: 'Name, email, password and company are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    // Check for duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    const companyName = company.trim();
    const client = await pool.connect();
    let newUser;
    try {
      await client.query('BEGIN');
      const { organizationId, companyId } = await insertOrgAndCompany(client, {
        orgName: companyName,
        companyName: companyName,
      });
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, company, phone, organization_id, company_id)
         VALUES ($1, $2, $3, 'company_owner', $4, $5, $6, $7)
         RETURNING id, name, email, role, company, phone, organization_id, company_id, created_at`,
        [
          name.trim(),
          email.toLowerCase().trim(),
          hash,
          companyName,
          phone || null,
          organizationId,
          companyId,
        ]
      );
      newUser = rows[0];
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    logAudit({ auth: { userId: newUser.id, organization_id: newUser.organization_id, company_id: newUser.company_id }, action: 'create', entityType: 'users', entityId: newUser.id, newData: { email: newUser.email, role: newUser.role, name: newUser.name } });

    const token = jwt.sign(
      { id: newUser.id, jti: crypto.randomUUID(), email: newUser.email, role: newUser.role, name: newUser.name, company: newUser.company, organization_id: newUser.organization_id, company_id: newUser.company_id },
      SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login — rate limited to prevent brute force attacks
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, jti: crypto.randomUUID(), email: user.email, role: user.role, name: user.name, company: user.company, organization_id: user.organization_id, company_id: user.company_id },
      SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,name,email,role,company,phone,avatar,organization_id,company_id,created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, phone } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name=$1, phone=$2 WHERE id=$3 RETURNING id,name,email,role,company,phone,avatar,organization_id,company_id',
      [name, phone, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/password
router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/preferences — get current user's notification preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT notification_preferences FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]?.notification_preferences ?? null);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/preferences — save current user's notification preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET notification_preferences = $1 WHERE id = $2 RETURNING notification_preferences',
      [JSON.stringify(req.body), req.user.id]
    );
    res.json(rows[0].notification_preferences);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/users — list all users (admin+ only)
router.get('/users', authMiddleware, async (req, res) => {
  if (!['super_admin','company_owner','admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  try {
    const isSuper = req.user.role === 'super_admin';
    const orgId = req.user.organization_id;
    let query;
    let params;
    if (isSuper) {
      // super_admin sees all users across orgs
      query = 'SELECT id,name,email,role,company,phone,avatar,organization_id,company_id,created_at FROM users ORDER BY created_at DESC';
      params = [];
    } else {
      // Regular admins see only their org's users
      query = 'SELECT id,name,email,role,company,phone,avatar,organization_id,company_id,created_at FROM users WHERE organization_id = $1 ORDER BY created_at DESC';
      params = [orgId];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/users — create user (admin+ only)
router.post('/users', authMiddleware, async (req, res) => {
  if (!['super_admin','company_owner','admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const { name, email, password, role = 'project_manager', company, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,company,phone,organization_id,company_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,email,role,company,phone,organization_id,company_id,created_at',
      [name, email.toLowerCase().trim(), hash, role, company || 'CortexBuild Ltd', phone || null, req.user.organization_id, req.user.company_id]
    );
    const newUser = rows[0];
    logAudit({ auth: req.user, action: 'create', entityType: 'users', entityId: newUser.id, newData: { email: newUser.email, role: newUser.role, name: newUser.name } });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already in use' });
    console.error('[auth/users POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/users/:id — delete user (super_admin / company_owner only)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  if (!['super_admin','company_owner'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'Cannot delete your own account' });

  try {
    const oldRows = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!oldRows.rowCount) return res.status(404).json({ message: 'User not found' });
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    logAudit({ auth: req.user, action: 'delete', entityType: 'users', entityId: req.params.id, oldData: oldRows.rows[0] });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/avatar
router.put('/avatar', authMiddleware, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ message: 'Avatar URL required' });
  // Only allow https:// URLs to prevent javascript: / data: URI injection
  if (typeof avatar !== 'string' || !avatar.startsWith('https://')) {
    return res.status(400).json({ message: 'Avatar must be a valid https:// URL' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET avatar=$1 WHERE id=$2 RETURNING id,name,email,role,company,phone,avatar',
      [avatar, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/settings — get all user settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM app_settings WHERE user_id=$1',
      [req.user.id]
    );
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const VALID_SETTING_KEYS = ['notifications', 'theme', 'company', 'language', 'timezone', 'dashboard', 'alerts', 'reports'];

// PUT /api/auth/settings — upsert a setting key
router.put('/settings', authMiddleware, async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ message: 'key required' });
  if (!VALID_SETTING_KEYS.includes(key)) {
    return res.status(400).json({ message: `Invalid setting key. Allowed: ${VALID_SETTING_KEYS.join(', ')}` });
  }
  try {
    await pool.query(
      `INSERT INTO app_settings (user_id, key, value)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (user_id, key) DO UPDATE SET value=$3::jsonb, updated_at=now()`,
      [req.user.id, key, JSON.stringify(value)]
    );
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout — revoke JWT and clear cookie
router.post('/logout', authMiddleware, async (req, res) => {
  const { jti, exp } = req.user;
  const ttl = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 60) : 3600;
  await blacklistToken(jti, ttl);
  await revokeAllUserTokens(req.user.id);
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
