/**
 * Auth routes.
 *
 *   POST /api/auth/register        public
 *   POST /api/auth/login           public
 *   GET  /api/auth/me              protected
 *   PUT  /api/auth/update-profile  protected
 *
 * Google OAuth:
 *   GET  /api/auth/google          redirect to Google
 *   GET  /api/auth/google/callback Google redirects here → JWT → redirect to frontend
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const { registerRules, loginRules, updateProfileRules } = require('../validators/auth.validator');

router.post('/register', registerRules, validateRequest, authController.register);
router.post('/login', loginRules, validateRequest, authController.login);
router.get('/me', protect, authController.me);
router.put('/update-profile', protect, updateProfileRules, validateRequest, authController.updateProfile);

// ── Google OAuth (server-side redirect flow) ──────────────────────────────────
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ success: false, message: 'Google OAuth is not configured.' });
  }
  const baseURL = process.env.BETTER_AUTH_URL || `https://${req.headers.host}`;
  const callbackURL = `${baseURL}/api/auth/google/callback`;
  const frontendCallbackURL = req.query.callbackURL || process.env.CLIENT_URL || '/';

  // Store frontend redirect in state param
  const state = Buffer.from(JSON.stringify({ callbackURL: frontendCallbackURL })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackURL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';

  if (error || !code) {
    return res.redirect(`${clientURL}/login?error=google_failed`);
  }

  // Parse state
  let frontendCallbackURL = `${clientURL}/callback`;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (decoded.callbackURL) frontendCallbackURL = decoded.callbackURL;
  } catch (_) { }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseURL = process.env.BETTER_AUTH_URL || `https://${req.headers.host}`;
    const callbackURL = `${baseURL}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackURL,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    if (!googleUser.email) throw new Error('No email returned from Google.');

    // Find or create user
    const User = require('../models/User.model');
    const { signToken } = require('../config/auth');

    let user = await User.findOne({ email: googleUser.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email.toLowerCase(),
        emailVerified: googleUser.verified_email || false,
        image: googleUser.picture || '',
        role: 'collaborator',
        // No password for OAuth users
        password: require('bcryptjs').hashSync(Math.random().toString(36), 10),
      });
    } else {
      // Update profile picture if changed
      if (googleUser.picture && user.image !== googleUser.picture) {
        user.image = googleUser.picture;
        await user.save();
      }
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    // Redirect to frontend with token in URL param
    const redirectURL = new URL(frontendCallbackURL);
    redirectURL.searchParams.set('token', token);
    res.redirect(redirectURL.toString());
  } catch (err) {
    console.error('[Google OAuth]', err.message);
    res.redirect(`${clientURL}/login?error=google_failed`);
  }
});

module.exports = router;
