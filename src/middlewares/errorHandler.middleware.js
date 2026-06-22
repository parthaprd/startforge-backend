const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const isDev = process.env.NODE_ENV === 'development';

const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new ApiError(400, 'Validation failed.', errors);
  }

  if (err.code === 11000 || err.code === 11001) {
    const fields = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    const values = err.keyValue ? JSON.stringify(err.keyValue) : '';
    return new ApiError(409, `Duplicate value for ${fields}: ${values}`);
  }

  if (err.name === 'CastError') {
    return new ApiError(400, `Invalid value for "${err.path}": ${err.value}`);
  }

  if (err.name === 'JsonWebTokenError') {
    return new ApiError(401, 'Invalid authentication token.');
  }
  if (err.name === 'TokenExpiredError') {
    return new ApiError(401, 'Your session has expired. Please log in again.');
  }

  if (err.type && String(err.type).startsWith('Stripe')) {
    const status = err.statusCode || 502;
    return new ApiError(status, err.message || 'Payment provider error.');
  }

  return new ApiError(
    err.statusCode || 500,
    isDev ? err.message : 'Internal server error. Please try again later.'
  );
};

const errorHandler = (err, req, res, _next) => {
  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} -> 500`, {
      message: err.message,
      stack: err.stack,
    });
  } else if (!err.isOperational && normalized.statusCode >= 400) {
    logger.warn(`[${req.method}] ${req.originalUrl} -> ${normalized.statusCode}: ${err.message}`);
  }

  const body = {
    success: false,
    message: normalized.message,
  };

  if (normalized.errors && normalized.errors.length) {
    body.errors = normalized.errors;
  }

  return res.status(normalized.statusCode).json(body);
};

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFound,
  normalizeError,
};
