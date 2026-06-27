/**
 * Express application factory.
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
const authRoutes = require('./routes/auth.routes');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler.middleware');

const morganStream = { write: (msg) => logger.http(msg.trim()) };

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());

  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: morganStream,
    skip: (_req, res) => res.statusCode >= 500,
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });
  app.use('/api', limiter);

  // Auth routes (register, login, me, Google OAuth)
  app.use('/api/auth', authRoutes);

  // All other routes
  app.use('/api', routes);

  // Serve static dashboard
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
