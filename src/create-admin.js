/**
 * Create Admin Script
 *
 * Creates a new admin user via Better Auth (email + password) and sets the
 * `admin` role. Run with: node src/create-admin.js
 *
 * Override defaults via env:
 *   ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=MyPass123 ADMIN_NAME="My Name" node src/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');
const connectDB = require('./config/database');
const { getAuth } = require('./config/auth');
const logger = require('./utils/logger');

const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@startupforge.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

const createAdmin = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      logger.warn(`\u26a0\ufe0f  A user with email "${ADMIN_EMAIL}" already exists (role: ${existing.role}).`);
      logger.warn('   To promote them, update the role manually or delete and re-run.');
      return;
    }

    const auth = await getAuth();
    await auth.api.signUpEmail({
      body: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        bio: 'Platform administrator.',
      },
    });

    // Ensure the role is set (additionalFields default is collaborator).
    const admin = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      { role: 'admin' },
      { new: true }
    );

    logger.info('\u2705  Admin user created successfully!');
    logger.info(`    Name  : ${admin.name}`);
    logger.info(`    Email : ${admin.email}`);
    logger.info(`    Role  : ${admin.role}`);
    logger.info(`    ID    : ${admin._id}`);
  } catch (err) {
    logger.error('\u274c  Failed to create admin:', err.message || err);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed.');
  }
};

createAdmin();
