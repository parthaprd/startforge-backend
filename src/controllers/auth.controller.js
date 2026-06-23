const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');

/**
 * Note: register / login / logout are served by Better Auth:
 *   POST /api/auth/sign-up/email
 *   POST /api/auth/sign-in/email
 *   POST /api/auth/sign-out
 *   GET  /api/auth/get-session   (and social: /api/auth/sign-in/social)
 */

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
  me,
  updateProfile,
};
