/**
 * Application entry point.
 *
 * Responsibilities:
 *   - Load environment variables (dotenv).
 *   - Connect to MongoDB.
 *   - Start the HTTP server.
 *   - Wire graceful shutdown on SIGINT/SIGTERM.
 *
 * Centralized error handling here ensures we never silently crash.
 */
require('dotenv').config();

const http = require('http');
const path = require('path');

// Ensure the logs directory exists before winston tries to write to it.
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = require('./utils/logger');
const connectDB = require('./config/database');
const createApp = require('./app');

// Catch programming errors that escape try/catch so they at least log.
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`, { stack: err.stack });
  // Give winston a tick to flush, then exit (a restart supervisor should pick up).
  setImmediate(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error(`UNHANDLED REJECTION: ${reason && reason.message ? reason.message : reason}`);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to the database first.
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(
        `🚀 StartupForge API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
      );
      logger.info(`   -> http://localhost:${PORT}/api/health`);
    });

    // ---- Graceful shutdown. ----
    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        const { mongoose } = require('mongoose');
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed.');
          process.exit(0);
        });
      });

      // Force-exit if graceful close stalls.
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

startServer();
