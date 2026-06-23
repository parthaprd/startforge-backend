/**
 * Auth service.
 *
 * Registration / login / logout are handled entirely by Better Auth at
 * /api/auth/*. What remains here are the app-specific profile helpers used by
 * the custom /api/auth/me and /api/auth/update-profile endpoints.
 */
const User = require('../models/User.model');

const toPublicUser = (user) => {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  return obj;
};

const updateProfile = async (user, updates) => {
  const allowed = {};
  const fields = ['name', 'bio', 'skills', 'portfolio', 'image'];
  for (const f of fields) {
    if (updates[f] !== undefined) allowed[f] = updates[f];
  }

  // Match by email so we don't depend on the _id representation used by the
  // Better Auth adapter.
  const updated = await User.findOneAndUpdate({ email: user.email }, allowed, {
    new: true,
    runValidators: true,
  });

  return updated;
};

module.exports = {
  toPublicUser,
  updateProfile,
};
