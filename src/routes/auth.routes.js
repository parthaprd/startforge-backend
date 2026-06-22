/**
 * Auth routes.
 *
 *   POST   /register
 *   POST   /login
 *   POST   /logout
 *   GET    /me              (protected)
 *   PUT    /update-profile  (protected)
 */
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
  registerRules,
  loginRules,
  updateProfileRules,
} = require('../validators/auth.validator');

router.post('/register', registerRules, validateRequest, authController.register);
router.post('/login', loginRules, validateRequest, authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.me);
router.put(
  '/update-profile',
  protect,
  updateProfileRules,
  validateRequest,
  authController.updateProfile
);

module.exports = router;
