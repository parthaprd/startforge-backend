const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');

/**
 * POST /api/auth/register
 * Body: { name, email, password, role?, image? }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, image } = req.body;
  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email and password are required.');
  }
  const { token, user } = await authService.register({ name, email, password, role, image });
  return res.status(201).json({ success: true, token, user });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required.');
  }
  const { token, user } = await authService.login({ email, password });
  return res.status(200).json({ success: true, token, user });
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Not authenticated.');
  return ApiResponse.ok(res, 'Current user.', authService.toPublicUser(req.user));
});

/**
 * PUT /api/auth/update-profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updated = await authService.updateProfile(req.user, req.body);
  return ApiResponse.ok(res, 'Profile updated successfully.', authService.toPublicUser(updated));
});

module.exports = { register, login, me, updateProfile };
