/**
 * Authentication middleware backed by Better Auth.
 *
 * `protect` reads the Better Auth session from the request (cookie or bearer
 * header) and then loads the matching Mongoose `User` document by email, so
 * downstream controllers keep receiving a full Mongoose user (with _id, role,
 * isPremium, virtuals, etc.) – exactly like before.
 */
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { getAuth } = require('../config/auth');

const resolveSession = async (req) => {
  const { fromNodeHeaders } = await import('better-auth/node');
  const auth = await getAuth();
  return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
};

const protect = async (req, _res, next) => {
  try {
    const session = await resolveSession(req);
    if (!session || !session.user) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new ApiError(401, 'The user belonging to this session no longer exists.');
    }
    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been blocked. Please contact support.');
    }

    req.user = user;
    req.authSession = session.session;
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const session = await resolveSession(req);
    if (session && session.user) {
      const user = await User.findOne({ email: session.user.email });
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch (err) {
    logger.debug(`optionalAuth ignored invalid session: ${err.message}`);
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
};
