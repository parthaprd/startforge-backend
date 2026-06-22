const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const {
  getFounderStats,
  getCollaboratorStats,
} = require('../controllers/dashboard.controller');

router.get('/founder/stats', protect, authorize('founder'), getFounderStats);
router.get('/collaborator/stats', protect, authorize('collaborator'), getCollaboratorStats);

module.exports = router;
