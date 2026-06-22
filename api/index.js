/**
 * Vercel Serverless Function entry point.
 *
 * Vercel invokes this file for every request under /api/*.
 * It reuses the Express app from src/app.js but does NOT call listen().
 * Instead it exports the Express app directly — Vercel's Node.js runtime
 * calls app(req, res) for each incoming request.
 *
 * The MongoDB connection is cached on the global object so that warm
 * invocations skip the connect handshake.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const createApp = require('../src/app');

let cachedDb = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  // Reuse cached connection in warm invocations.
  if (mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const conn = await mongoose.connect(uri, {
    dbName: dbName || 'startupforge',
    serverSelectionTimeoutMS: 5000, // fail fast in serverless
    serverApi: { version: '1', strictMode: false, deprecationErrors: false },
    maxPoolSize: 5, // smaller pool for serverless
  });

  cachedDb = conn;
  return conn;
};

/**
 * Lazy-initialised Express app.
 * We build the app on first invocation (after DB is ready) and cache it
 * so that subsequent warm invocations skip both DB connect and app creation.
 */
let cachedApp = null;
let dbConnecting = null;

const getApp = async () => {
  if (cachedApp) {
    return cachedApp;
  }

  // Prevent multiple simultaneous connection attempts.
  if (!dbConnecting) {
    dbConnecting = connectDB().then(() => {
      cachedApp = createApp();
      return cachedApp;
    }).catch((err) => {
      dbConnecting = null; // allow retry on next request
      throw err;
    });
  }

  return dbConnecting;
};

// ---- Vercel serverless handler ----
module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('Serverless startup error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Database connection failed.',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    }
  }
};
