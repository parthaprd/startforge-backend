/**
 * Custom auth/profile routes (mounted at /api/auth BEFORE the Better Auth
 * catch-all in src/app.js, so these specific paths take precedence and every
 * other /api/auth/* request falls through to Better Auth.
 *
 *   POST /api/auth/sign-in/email   — wraps Better Auth, injects signedToken
 *   POST /api/auth/sign-up/email   — wraps Better Auth, injects signedToken
 *   GET  /api/auth/session-token   — returns signed token from active session
 *   GET  /api/auth/me              — (protected)
 *   PUT  /api/auth/update-profile  — (protected)
 */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const { updateProfileRules } = require('../validators/auth.validator');
const { getAuth } = require('../config/auth');

// ── Sign-in: call Better Auth's API directly, inject signedToken ─────────────
router.post('/sign-in/email', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const auth = await getAuth();
    const { fromNodeHeaders } = await import('better-auth/node');

    const result = await auth.api.signInEmail({
      body: req.body,
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    // Forward all headers (cookies, etc.) from Better Auth's response
    result.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    const body = await result.json();

    // Extract the full signed token from the Set-Cookie header
    const setCookieVal = result.headers.get('set-cookie') || '';
    const match = setCookieVal.match(/better-auth\.session_token=([^;]+)/);
    if (match) {
      body.signedToken = decodeURIComponent(match[1]);
    }

    return res.status(result.status).json(body);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Sign-up: same pattern ─────────────────────────────────────────────────────
router.post('/sign-up/email', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const auth = await getAuth();
    const { fromNodeHeaders } = await import('better-auth/node');

    const result = await auth.api.signUpEmail({
      body: req.body,
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    result.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    const body = await result.json();

    const setCookieVal = result.headers.get('set-cookie') || '';
    const match = setCookieVal.match(/better-auth\.session_token=([^;]+)/);
    if (match) {
      body.signedToken = decodeURIComponent(match[1]);
    }

    return res.status(result.status).json(body);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', protect, authController.me);

// Returns the full signed session token so the frontend can store it for
// cross-origin requests (browsers block reading Set-Cookie headers in JS).
// Call this immediately after sign-in/email while the browser cookie is set.
router.get('/session-token', async (req, res) => {
  try {
    const { fromNodeHeaders } = await import('better-auth/node');
    const { getAuth } = require('../config/auth');
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ success: false, message: 'No active session.' });
    }
    // The raw signed token is the cookie value — extract it from the request
    const rawCookie = req.headers.cookie || '';
    const match = rawCookie.match(/better-auth\.session_token=([^;]+)/);
    const signedToken = match ? decodeURIComponent(match[1]) : null;
    return res.json({ success: true, token: signedToken, sessionToken: session.session?.token });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put(
  '/update-profile',
  // Local JSON parser: the global express.json() is registered after this
  // router (it must run after the Better Auth handler).
  express.json({ limit: '1mb' }),
  protect,
  updateProfileRules,
  validateRequest,
  authController.updateProfile
);

module.exports = router;
