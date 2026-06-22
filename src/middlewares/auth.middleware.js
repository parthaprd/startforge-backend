const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { verifyToken, signToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const COOKIE_NAME = 'token';

const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  const header = req.headers.authorization || req.headers.Authorization;
  if (header && /^bearer\s+/i.test(header)) {
    return header.replace(/^bearer\s+/i, '').trim();
  }
  return null;
};

const protect = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'The user belonging to this session no longer exists.');
    }

    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been blocked. Please contact support.');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch (err) {
    logger.debug(`optionalAuth ignored invalid token: ${err.message}`);
  }
  next();
};

const setAuthCookie = (res, token) => {
  const days = parseInt(process.env.JWT_COOKIE_EXPIRE || '7', 10);
  const maxAge = days * 24 * 60 * 60 * 1000;

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge,
    path: '/',
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
};

const issueAuth = (res, user) => {
  const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
  setAuthCookie(res, token);
  return token;
};

module.exports = {
  protect,
  optionalAuth,
  setAuthCookie,
  clearAuthCookie,
  issueAuth,
  COOKIE_NAME,
};
