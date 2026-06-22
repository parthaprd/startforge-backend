/**
 * Application routes.
 *
 *   POST   /                           collaborator
 *   GET    /my-applications            collaborator
 *   GET    /opportunity/:id            founder
 *   PUT    /:id/status                 founder
 *   DELETE /:id                        collaborator
 *
 * Static routes are registered before /:id so they win.
 */
const express = require('express');
const router = express.Router();

const applicationController = require('../controllers/application.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isCollaborator } = require('../middlewares/rbac.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
  createApplicationRules,
  updateApplicationStatusRules,
} = require('../validators/opportunity.validator');

// All routes require authentication.
router.use(protect);

// Collaborator applies.
router.post(
  '/',
  createApplicationRules,
  validateRequest,
  applicationController.apply
);

// Check if collaborator already applied to this opportunity.
router.get('/check/:opportunityId', isCollaborator, applicationController.checkApplication);

// Collaborator's own applications.
router.get('/my-applications', applicationController.listMyApplications);

// Founder views applications for a specific opportunity.
router.get('/opportunity/:id', applicationController.listForOpportunity);

// Founder updates application status.
router.put(
  '/:id/status',
  updateApplicationStatusRules,
  validateRequest,
  applicationController.updateStatus
);

// Collaborator withdraws application.
router.delete('/:id', applicationController.withdraw);

// Get single application details.
router.get('/:id', applicationController.getApplicationById);

module.exports = router;
