const ApiError = require('../utils/ApiError');

const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    const allowed = new Set(roles);
    if (!allowed.has(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. This action requires one of: ${roles.join(', ')}.`
        )
      );
    }

    next();
  };

const isFounder = authorize('founder');
const isCollaborator = authorize('collaborator');
const isAdmin = authorize('admin');

module.exports = {
  authorize,
  isFounder,
  isCollaborator,
  isAdmin,
};
