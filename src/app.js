/**
 * Express application factory.
 *
 * Encapsulates all middleware wiring so the entry point (server.js)
 * stays focused on bootstrapping (DB connect + listen).
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const path = require('path');

const corsOptions = require('./config/cors');
const routes = require('./routes');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler.middleware');

const morganStream = {
  write: (message) => logger.http(message.trim()),
};

const createApp = () => {
  const app = express();

  // ---- Trust proxy so secure cookies work behind load balancers. ----
  app.set('trust proxy', 1);

  // ---- Security headers. ----
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // API only; CSP belongs to the frontend.
    })
  );

  // ---- CORS. ----
  app.use(cors(corsOptions));

  // ---- Raw body capture for Stripe webhook. ----
  // We need access to req.rawBody for signature verification. Instead of
  // configuring express.json with verify, we let the webhook route use its
  // own express.raw() parser (see payment.routes.js). Here we just parse
  // JSON for everything else.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ---- Cookies. ----
  app.use(cookieParser());

  // ---- Prevent NoSQL injection ($, . in keys). ----
  app.use(mongoSanitize());

  // ---- HTTP request logging. ----
  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: morganStream,
      skip: (_req, res) => res.statusCode >= 500, // logged at error level by handler
    })
  );

  // ---- Global rate limiter (1000 req / 15 min per IP). ----
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again later.',
    },
  });
  app.use('/api', limiter);

  // ---- Routes. ----
  app.use('/api', routes);

  // Serve static dashboard
  app.use(express.static(path.join(__dirname, 'public')));

  // ---- 404 + global error handler (must be last). ----
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
