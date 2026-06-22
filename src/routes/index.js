const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const startupRoutes = require('./startup.routes');
const opportunityRoutes = require('./opportunity.routes');
const applicationRoutes = require('./application.routes');
const paymentRoutes = require('./payment.routes');
const adminRoutes = require('./admin.routes');
const uploadRoutes = require('./upload.routes');
const testRoutes = require('./test.routes');
const dashboardRoutes = require('./dashboard.routes');
const statsRoutes = require('./stats.routes');

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'StartupForge API is up.',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

router.get('/', (_req, res) => {
  res.status(200).send('api is working');
});

router.use('/auth', authRoutes);
router.use('/startups', startupRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/applications', applicationRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/test', testRoutes);
router.use('/stats', statsRoutes);
router.use('/', dashboardRoutes);

module.exports = router;
