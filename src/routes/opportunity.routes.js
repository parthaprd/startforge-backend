/**
 * Opportunity routes.
 *
 *   GET    /                       public
 *   GET    /my-opportunities       founder
 *   GET    /:id                    public
 *   POST   /                       founder
 *   PUT    /:id                    founder
 *   DELETE /:id                    founder
 *
 * /my-opportunities is registered before /:id so the static path wins.
 */
const express = require('express');
const router = express.Router();

const opportunityController = require('../controllers/opportunity.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isFounder } = require('../middlewares/rbac.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
  createOpportunityRules,
  updateOpportunityRules,
} = require('../validators/opportunity.validator');

// Public
router.get('/', opportunityController.listOpportunities);

// These routes MUST come before /:id
router.get('/featured', opportunityController.getFeaturedOpportunities);
router.get('/my-count', protect, isFounder, opportunityController.getMyOpportunityCount);

// Founder-only static route MUST come before the dynamic :id route.
router.get('/my-opportunities', protect, isFounder, opportunityController.listMyOpportunities);

// Public single opportunity
router.get('/:id', opportunityController.getOpportunity);

// Founder mutations
router.post(
  '/',
  protect,
  isFounder,
  createOpportunityRules,
  validateRequest,
  opportunityController.createOpportunity
);
router.put(
  '/:id',
  protect,
  isFounder,
  updateOpportunityRules,
  validateRequest,
  opportunityController.updateOpportunity
);
router.delete('/:id', protect, isFounder, opportunityController.deleteOpportunity);

module.exports = router;
