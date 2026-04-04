const express    = require('express');
const passport   = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: MicrosoftStrategy } = require('passport-microsoft');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const rateLimit  = require('express-rate-limit');
const db         = require('../db');
const router     = express.Router();

// Rate limiter for OAuth callbacks (prevent brute force attacks)
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many OAuth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OAuth state storage for CSRF protection (in-memory for now, use Redis in production)
const oauthStateStore = new Map();

// Clean up expired state entries after 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStateStore.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      oauthStateStore.delete(state);
    }
  }
}, 60 * 1000);

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
        // Create new user
        const result = await db.query(
          `INSERT INTO users (email, name, avatar_url, email_verified)
           VALUES ($1, $2, $3, true)
           RETURNING *`,
          [email.toLowerCase(), name, avatar]
        );
        user = result.rows[0];
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
        // Create new user
        const result = await db.query(
          `INSERT INTO users (email, name, email_verified)
           VALUES ($1, $2, true)
           RETURNING *`,
          [email.toLowerCase(), name]
        );
        user = result.rows[0];
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
router.get('/google', (req, res, next) => {
  // Generate cryptographically random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  const frontendRedirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  // Store state with expiry (10 minutes) and intended redirect
  oauthStateStore.set(state, {
    createdAt: Date.now(),
    redirectUri: frontendRedirect
  });

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});

// Google OAuth callback (rate limited)
router.get('/google/callback', oauthLimiter, (req, res, next) => {
  const { state } = req.query;

  // Validate state parameter (CSRF protection)
  if (!state || !oauthStateStore.has(state)) {
    console.warn('[OAuth] Invalid or missing state parameter - possible CSRF attack');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=invalid_state`);
  }

  const storedState = oauthStateStore.get(state);
  oauthStateStore.delete(state); // One-time use

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

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role || 'field_worker'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie (not accessible by JavaScript, protects against XSS)
      const redirectUri = storedState.redirectUri;
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.redirect(redirectUri);
    } catch (e) {
      console.error('[OAuth] Google callback error:', e);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }
  })(req, res, next);
});

// Initialize Microsoft OAuth with CSRF-protected state
router.get('/microsoft', (req, res, next) => {
  // Generate cryptographically random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  const frontendRedirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  // Store state with expiry (10 minutes) and intended redirect
  oauthStateStore.set(state, {
    createdAt: Date.now(),
    redirectUri: frontendRedirect
  });

  passport.authenticate('microsoft', {
    scope: ['user.read'],
    state: state
  })(req, res, next);
});

// Microsoft OAuth callback (rate limited)
router.get('/microsoft/callback', oauthLimiter, (req, res, next) => {
  const { state } = req.query;

  // Validate state parameter (CSRF protection)
  if (!state || !oauthStateStore.has(state)) {
    console.warn('[OAuth] Invalid or missing state parameter - possible CSRF attack');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=invalid_state`);
  }

  const storedState = oauthStateStore.get(state);
  oauthStateStore.delete(state); // One-time use

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

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role || 'field_worker'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie (not accessible by JavaScript, protects against XSS)
      const redirectUri = storedState.redirectUri;
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.redirect(redirectUri);
    } catch (e) {
      console.error('[OAuth] Microsoft callback error:', e);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=microsoft_auth_failed`);
    }
  })(req, res, next);
});

// Link Google account to existing user (requires JWT auth)
router.post('/google/link', async (req, res) => {
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
router.delete('/google/unlink', async (req, res) => {
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
router.get('/oauth/providers', async (req, res) => {
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
