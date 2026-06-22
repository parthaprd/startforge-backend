/**
 * Admin routes - all require authentication + admin role.
 *
 *   GET    /users
 *   PUT    /users/:id/block
 *   PUT    /users/:id/unblock
 *   GET    /startups
 *   PUT    /startups/:id/approve
 *   PUT    /startups/:id/reject
 *   DELETE /startups/:id
 *   GET    /transactions
 *   GET    /analytics
 */
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/rbac.middleware');

// Everything under /api/admin requires an authenticated admin.
router.use(protect, isAdmin);

router.get('/users', adminController.listUsers);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);

router.get('/startups', adminController.listStartups);
router.put('/startups/:id/approve', adminController.approveStartup);
router.put('/startups/:id/reject', adminController.rejectStartup);
router.delete('/startups/:id', adminController.deleteStartup);

router.get('/transactions', adminController.listTransactions);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
