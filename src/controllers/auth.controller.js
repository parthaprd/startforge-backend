const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');
const { issueAuth, clearAuthCookie } = require('../middlewares/auth.middleware');

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  const token = issueAuth(res, user);
  return ApiResponse.created(res, 'Account created successfully.', {
    user: authService.toPublicUser(user),
    token,
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req.body);
  const token = issueAuth(res, user);
  return ApiResponse.ok(res, 'Logged in successfully.', {
    user: authService.toPublicUser(user),
    token,
  });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return ApiResponse.ok(res, 'Logged out successfully.');
});

const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Not authenticated.');
  return ApiResponse.ok(res, 'Current user.', {
    user: authService.toPublicUser(req.user),
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const updated = await authService.updateProfile(req.user, req.body);
  return ApiResponse.ok(res, 'Profile updated successfully.', {
    user: authService.toPublicUser(updated),
  });
});

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
};
