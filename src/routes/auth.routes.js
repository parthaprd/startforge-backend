/**
 * Custom auth/profile routes (mounted at /api/auth BEFORE the Better Auth
 * catch-all in src/app.js, so these specific paths take precedence and every
 * other /api/auth/* request falls through to Better Auth).
 *
 *   GET  /api/auth/me              (protected)
 *   PUT  /api/auth/update-profile  (protected)
 *
 * register / login / logout are provided by Better Auth
 * (/api/auth/sign-up/email, /api/auth/sign-in/email, /api/auth/sign-out).
 */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const { updateProfileRules } = require('../validators/auth.validator');

router.get('/me', protect, authController.me);

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
