/**
 * Startup routes.
 *
 *   GET    /                     public
 *   GET    /my-startup           founder
 *   GET    /:id                  public
 *   POST   /                     founder
 *   PUT    /:id                  founder
 *   DELETE /:id                  founder
 *
 * Note: /my-startup is registered BEFORE /:id so the static path wins
 * over the dynamic one.
 */
const express = require('express');
const router = express.Router();

const startupController = require('../controllers/startup.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isFounder } = require('../middlewares/rbac.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
  createStartupRules,
  updateStartupRules,
} = require('../validators/startup.validator');

// Public
router.get('/', startupController.listStartups);

// Featured route MUST come before /:id
router.get('/featured', startupController.getFeaturedStartups);

// Founder-only static route MUST come before the dynamic :id route.
router.get('/my-startup', protect, isFounder, startupController.getMyStartup);

// Public single startup
router.get('/:id', startupController.getStartup);

// Founder mutations
router.post(
  '/',
  protect,
  isFounder,
  createStartupRules,
  validateRequest,
  startupController.createStartup
);
router.put(
  '/:id',
  protect,
  isFounder,
  updateStartupRules,
  validateRequest,
  startupController.updateStartup
);
router.delete('/:id', protect, isFounder, startupController.deleteStartup);

module.exports = router;
