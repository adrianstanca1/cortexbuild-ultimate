const express    = require('express');
const passport   = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: MicrosoftStrategy } = require('passport-microsoft');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const rateLimit  = require('express-rate-limit');
const redis      = require('redis');
const db         = require('../db');
const { createOAuthUserWithTenant } = require('../lib/bootstrap-tenant');
const authMiddleware = require('../middleware/auth');
const router     = express.Router();

// Redis client for OAuth state storage (distributed, survives restarts)
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(err => console.error('[OAuth Redis]', err.message));

const STATE_TTL = 600; // 10 minutes

async function setOAuthState(state, data) {
  await redisClient.setEx(`oauth:state:${state}`, STATE_TTL, JSON.stringify(data));
}

async function getOAuthState(state) {
  const data = await redisClient.get(`oauth:state:${state}`);
  return data ? JSON.parse(data) : null;
}

async function deleteOAuthState(state) {
  await redisClient.del(`oauth:state:${state}`);
}

// Rate limiter for OAuth callbacks (prevent brute force attacks)
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many OAuth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure Google OAuth strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || profile.emails?.[0]?.value?.split('@')[0];
      const avatar = profile.photos?.[0]?.value;

      if (!email) {
        console.error('[OAuth] No email found from Google for profile:', profile.id);
        return done(null, false, { message: 'No email found from Google' });
      }

      // Check if user exists
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      let user;
      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
      } else {
        user = await createOAuthUserWithTenant(
          db,
          { email, name, avatarUrl: avatar ?? null },
          { orgName: `${name}'s organization`, companyName: name },
          {
            provider: 'google',
            providerUserId: profile.id,
            accessToken,
            refreshToken,
            email,
          }
        );
      }

      // Link OAuth provider if not already linked
      const providerCheck = await db.query(
        'SELECT * FROM oauth_providers WHERE user_id = $1 AND provider = $2',
        [user.id, 'google']
      );

      if (providerCheck.rows.length === 0) {
        await db.query(
          `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token, refresh_token, email)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, 'google', profile.id, accessToken, refreshToken, email]
        );
      } else {
        // Update tokens
        await db.query(
          'UPDATE oauth_providers SET access_token = $1, refresh_token = $2 WHERE user_id = $3 AND provider = $4',
          [accessToken, refreshToken, user.id, 'google']
        );
      }

      done(null, user);
    } catch (err) {
      console.error('[OAuth] Google strategy error:', err);
      done(err);
    }
  }));
}

// Configure Microsoft OAuth strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    scope: ['user.read'],
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || profile.emails?.[0]?.value?.split('@')[0];

      if (!email) {
        console.error('[OAuth] No email found from Microsoft for profile:', profile.id);
        return done(null, false, { message: 'No email found from Microsoft' });
      }

      // Check if user exists
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      let user;
      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
      } else {
        user = await createOAuthUserWithTenant(
          db,
          { email, name, avatarUrl: null },
          { orgName: `${name}'s organization`, companyName: name },
          {
            provider: 'microsoft',
            providerUserId: profile.id,
            accessToken,
            refreshToken,
            email,
          }
        );
      }

      // Link OAuth provider if not already linked
      const providerCheck = await db.query(
        'SELECT * FROM oauth_providers WHERE user_id = $1 AND provider = $2',
        [user.id, 'microsoft']
      );

      if (providerCheck.rows.length === 0) {
        await db.query(
          `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token, refresh_token, email)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, 'microsoft', profile.id, accessToken, refreshToken, email]
        );
      } else {
        // Update tokens
        await db.query(
          'UPDATE oauth_providers SET access_token = $1, refresh_token = $2 WHERE user_id = $3 AND provider = $4',
          [accessToken, refreshToken, user.id, 'microsoft']
        );
      }

      done(null, user);
    } catch (err) {
      console.error('[OAuth] Microsoft strategy error:', err);
      done(err);
    }
  }));
}

// Serialize/deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || false);
  } catch (err) {
    done(err);
  }
});

// Initialize Google OAuth with CSRF-protected state
router.get('/google', async (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    });
  }
  // Generate cryptographically random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  const frontendRedirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`;

  // Store state with expiry (10 minutes) and intended redirect
  await setOAuthState(state, {
    createdAt: Date.now(),
    redirectUri: frontendRedirect
  });

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});

// Google OAuth callback (rate limited)
router.get('/google/callback', oauthLimiter, async (req, res, next) => {
  const { state } = req.query;

  // Validate state parameter (CSRF protection)
  if (!state) {
    console.warn('[OAuth] Invalid or missing state parameter - possible CSRF attack');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=invalid_state`);
  }

  const storedState = await getOAuthState(state);
  if (!storedState) {
    console.warn('[OAuth] Invalid or missing state parameter - possible CSRF attack');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=invalid_state`);
  }

  await deleteOAuthState(state); // One-time use

  // Check if state has expired (10 minute window)
  if (Date.now() - storedState.createdAt > 10 * 60 * 1000) {
    console.warn('[OAuth] State parameter expired');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=state_expired`);
  }

  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        console.error('[OAuth] Google callback authentication failed:', err || info);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
      }

      // Generate JWT token — include name/company for consistency with regular login
      const token = jwt.sign(
        {
          id: user.id,
          jti: crypto.randomUUID(),
          email: user.email,
          name: user.name || null,
          role: user.role || 'field_worker',
          organization_id: user.organization_id || null,
          company_id: user.company_id || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to callback page with token in URL — frontend stores it in localStorage
      const redirectUri = storedState.redirectUri;
      res.redirect(`${redirectUri}?oauth_token=${token}`);
    } catch (e) {
      console.error('[OAuth] Google callback error:', e);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }
  })(req, res, next);
});

// Initialize Microsoft OAuth with CSRF-protected state
router.get('/microsoft', async (req, res, next) => {
  // Guard: Microsoft OAuth must be configured
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=microsoft_not_configured`);
  }
  // Generate cryptographically random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  const frontendRedirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`;

  // Store state with expiry (10 minutes) and intended redirect
  await setOAuthState(state, {
    createdAt: Date.now(),
    redirectUri: frontendRedirect
  });

  passport.authenticate('microsoft', {
    scope: ['user.read'],
    state: state
  })(req, res, next);
});

// Microsoft OAuth callback (rate limited)
router.get('/microsoft/callback', oauthLimiter, async (req, res, next) => {
  // Guard: Microsoft OAuth must be configured
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=microsoft_not_configured`);
  }
  const { state } = req.query;

  // Validate state parameter (CSRF protection)
  if (!state) {
    console.warn('[OAuth] Invalid or missing state parameter - possible CSRF attack');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=invalid_state`);
  }

  const storedState = await getOAuthState(state);
  if (!storedState) {
    console.warn('[OAuth] Invalid or missing state parameter - possible CSRF attack');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=invalid_state`);
  }

  await deleteOAuthState(state); // One-time use

  // Check if state has expired (10 minute window)
  if (Date.now() - storedState.createdAt > 10 * 60 * 1000) {
    console.warn('[OAuth] State parameter expired');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=state_expired`);
  }

  passport.authenticate('microsoft', { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        console.error('[OAuth] Microsoft callback authentication failed:', err || info);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=microsoft_auth_failed`);
      }

      // Generate JWT token — include name/company for consistency with regular login
      const token = jwt.sign(
        {
          id: user.id,
          jti: crypto.randomUUID(),
          email: user.email,
          name: user.name || null,
          role: user.role || 'field_worker',
          organization_id: user.organization_id || null,
          company_id: user.company_id || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to callback page with token in URL — frontend stores it in localStorage
      const redirectUri = storedState.redirectUri;
      res.redirect(`${redirectUri}?oauth_token=${token}`);
    } catch (e) {
      console.error('[OAuth] Microsoft callback error:', e);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=microsoft_auth_failed`);
    }
  })(req, res, next);
});

// Link Google account to existing user (requires JWT auth)
router.post('/google/link', authMiddleware, async (req, res) => {
  try {
    const { accessToken, refreshToken, profile } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if already linked
    const existing = await db.query(
      'SELECT * FROM oauth_providers WHERE user_id = $1 AND provider = $2',
      [userId, 'google']
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Google account already linked' });
    }

    // Link the account
    await db.query(
      `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token, refresh_token, email)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'google', profile?.id, accessToken, refreshToken, req.user?.email]
    );

    res.json({ success: true, message: 'Google account linked successfully' });
  } catch (err) {
    console.error('Failed to link Google account:', err);
    res.status(500).json({ error: 'Failed to link Google account' });
  }
});

// Unlink Google account (requires JWT auth)
router.delete('/google/unlink', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.query(
      'DELETE FROM oauth_providers WHERE user_id = $1 AND provider = $2',
      [userId, 'google']
    );

    res.json({ success: true, message: 'Google account unlinked successfully' });
  } catch (err) {
    console.error('Failed to unlink Google account:', err);
    res.status(500).json({ error: 'Failed to unlink Google account' });
  }
});

// Get OAuth providers for current user
router.get('/oauth/providers', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      'SELECT provider, email, created_at FROM oauth_providers WHERE user_id = $1',
      [userId]
    );

    res.json({ providers: result.rows });
  } catch (err) {
    console.error('Failed to get OAuth providers:', err);
    res.status(500).json({ error: 'Failed to get OAuth providers' });
  }
});

module.exports = router;
