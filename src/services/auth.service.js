const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

const toPublicUser = (user) => {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.googleId;
  return obj;
};

const registerUser = async (payload) => {
  const { email, password, googleId, name, role, image, bio, skills, portfolio } =
    payload;

  if (!email) throw ApiError.badRequest('Email is required.');
  if (!googleId && !password) {
    throw ApiError.badRequest('Password is required when not signing in with Google.');
  }

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, ...(googleId ? [{ googleId }] : [])],
  });

  if (existing) {
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      throw ApiError.conflict('An account with this email already exists.');
    }
    throw ApiError.conflict('An account already exists for this Google user.');
  }

  const doc = await User.create({
    name,
    email,
    password: googleId ? undefined : password,
    googleId: googleId || undefined,
    role: role || 'collaborator',
    image,
    bio,
    skills,
    portfolio,
  });

  return doc;
};

const loginUser = async (payload) => {
  const { email, password, googleId } = payload;

  if (!googleId && !email) {
    throw ApiError.badRequest('Email is required.');
  }

  let user;
  if (googleId) {
    user = await User.findOne({ googleId });
    if (!user) {
      if (!email || !payload.name) {
        throw ApiError.notFound('Google account not linked. Please register first.');
      }
      user = await registerUser({ ...payload, password: undefined });
    }
  } else {
    user = await User.findByEmailWithPassword(email);
    if (!user || !user.password) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const match = await user.comparePassword(password);
    if (!match) {
      throw ApiError.unauthorized('Invalid email or password.');
    }
  }

  if (user.isBlocked) {
    throw ApiError.forbidden('Your account has been blocked. Please contact support.');
  }

  return user;
};

const updateProfile = async (user, updates) => {
  const allowed = {};
  const fields = ['name', 'bio', 'skills', 'portfolio', 'image'];
  for (const f of fields) {
    if (updates[f] !== undefined) allowed[f] = updates[f];
  }

  const updated = await User.findByIdAndUpdate(user._id, allowed, {
    new: true,
    runValidators: true,
  });

  return updated;
};

module.exports = {
  registerUser,
  loginUser,
  updateProfile,
  toPublicUser,
};
