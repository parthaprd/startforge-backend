const logger = require('../utils/logger');

const buildAllowedOrigins = () => {
  const origins = new Set();

  if (process.env.CLIENT_URL) {
    origins.add(process.env.CLIENT_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 5000;
    origins.add(`http://localhost:${port}`);
    origins.add(`http://127.0.0.1:${port}`);
  }

  return Array.from(origins);
};

const allowedOrigins = buildAllowedOrigins();

const credentialsEnabled = allowedOrigins.length > 0;

logger.info(
  credentialsEnabled
    ? `CORS allowed origins: ${allowedOrigins.join(', ')}`
    : 'CORS: no allowed origins configured (permissive in development).'
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (!credentialsEnabled) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: credentialsEnabled,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 204,
};

module.exports = corsOptions;
module.exports.allowedOrigins = allowedOrigins;
