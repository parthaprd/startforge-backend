const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');
const logger = require('./logger');

const signToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not set. Cannot sign token.');
    throw ApiError.internal('Authentication is not properly configured.');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your session has expired. Please log in again.');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid authentication token.');
    }
    throw new ApiError(401, 'Authentication failed. Please log in again.');
  }
};

module.exports = {
  signToken,
  verifyToken,
};
