/**
 * Authentication middleware — JWT Bearer token.
 *
 * Reads the token from: Authorization: Bearer <token>
 * Verifies it, loads the Mongoose User doc, attaches to req.user.
 */
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../config/auth');

const protect = async (req, _res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new ApiError(401, 'Authentication required. Please log in.');

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Your session has expired. Please log in again.');
      }
      throw new ApiError(401, 'Invalid token. Please log in again.');
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'The user belonging to this token no longer exists.');
    if (user.isBlocked) throw new ApiError(403, 'Your account has been blocked. Please contact support.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);
        if (user && !user.isBlocked) req.user = user;
      }
    }
  } catch (_) { /* optional — ignore errors */ }
  next();
};

module.exports = { protect, optionalAuth };
