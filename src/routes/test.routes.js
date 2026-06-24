const express = require('express');
const router = express.Router();
const seedDatabase = require('../seed');
const runTests = require('../test-api');
const User = require('../models/User.model');
const Startup = require('../models/Startup.model');
const Opportunity = require('../models/Opportunity.model');
const Application = require('../models/Application.model');
const Payment = require('../models/Payment.model');

// POST /api/test/seed
router.post('/seed', async (req, res, next) => {
  try {
    // Dynamic import/run
    await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Database reset and seeded successfully!'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/test/run
router.post('/run', async (req, res, next) => {
  try {
    const port = process.env.PORT || 5000;
    const testResult = await runTests(`http://localhost:${port}`);
    res.status(200).json({
      success: true,
      data: testResult
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/test/data
router.get('/data', async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    const startups = await Startup.find({});
    const opportunities = await Opportunity.find({});
    const applications = await Application.find({});
    const payments = await Payment.find({});

    res.status(200).json({
      success: true,
      data: {
        users,
        startups,
        opportunities,
        applications,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/test/auth-config
router.get('/auth-config', async (req, res, next) => {
  try {
    const config = {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      betterAuthUrl: process.env.BETTER_AUTH_URL || 'NOT SET',
      trustedOrigins: process.env.TRUSTED_ORIGINS || process.env.CLIENT_URL || 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      mongoConnected: require('mongoose').connection.readyState === 1,
    };

    res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
