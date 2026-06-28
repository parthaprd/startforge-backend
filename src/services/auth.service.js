/**
 * Auth service — register, login, profile helpers.
 * Uses bcryptjs for password hashing and JWT for tokens.
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../config/auth');

const PLACEHOLDER_IMAGE =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const toPublicUser = (user) => {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

/**
 * Resolve the bcrypt hash for a given user.
 * Priority:
 *   1. user.password  (set by our own register endpoint)
 *   2. Better Auth `account` collection (set by seed / Better Auth signUpEmail)
 */
const resolvePasswordHash = async (user) => {
  // Already loaded via .select('+password')
  if (user.password) return user.password;

  // Fall back to Better Auth's account collection.
  // Better Auth stores userId as an ObjectId.
  try {
    const db = mongoose.connection.db;
    const account = await db.collection('account').findOne({
      userId: user._id, // ObjectId — matches how Better Auth stores it
      providerId: 'credential',
    });
    return account?.password || null;
  } catch {
    return null;
  }
};

const register = async ({ name, email, password, role = 'collaborator', image }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const hashed = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: ['founder', 'collaborator', 'admin'].includes(role) ? role : 'collaborator',
    image: image || PLACEHOLDER_IMAGE,
  });

  const token = signToken({ id: user._id, email: user.email, role: user.role });
  return { token, user: toPublicUser(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password.');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked. Please contact support.');

  // Get hash from user doc or fall back to Better Auth account collection
  const hash = await resolvePasswordHash(user);
  if (!hash) throw ApiError.unauthorized('Invalid email or password.');

  const isMatch = await bcrypt.compare(password, hash);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password.');

  const token = signToken({ id: user._id, email: user.email, role: user.role });
  return { token, user: toPublicUser(user) };
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

module.exports = { register, login, updateProfile, toPublicUser };
