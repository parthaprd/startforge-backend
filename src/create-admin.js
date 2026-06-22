/**
 * Create Admin Script
 *
 * Creates a new admin user with a custom email and password.
 * Run with: node src/create-admin.js
 *
 * You can override the default values via env args:
 *   ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=MyPass123 ADMIN_NAME="My Name" node src/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// ── Configurable via environment variables ──────────────────────────────────
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Super Admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@startupforge.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
// ────────────────────────────────────────────────────────────────────────────

const createAdmin = async () => {
  try {
    await connectDB();

    // Check if an admin with this email already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      logger.warn(`⚠️  A user with email "${ADMIN_EMAIL}" already exists (role: ${existing.role}).`);
      logger.warn('   If you want to promote them to admin, update the role manually or delete and re-run.');
      return;
    }

    const admin = new User({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,   // will be hashed by the pre-save hook
      role:     'admin',
      bio:      'Platform administrator.',
    });

    await admin.save();

    logger.info('✅  Admin user created successfully!');
    logger.info(`    Name  : ${admin.name}`);
    logger.info(`    Email : ${admin.email}`);
    logger.info(`    Role  : ${admin.role}`);
    logger.info(`    ID    : ${admin._id}`);
  } catch (err) {
    logger.error('❌  Failed to create admin:', err.message || err);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed.');
  }
};

createAdmin();
