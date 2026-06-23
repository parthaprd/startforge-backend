/**
 * User model.
 *
 * Authentication (passwords, sessions, social accounts) is handled by
 * Better Auth, which stores credentials in the separate `account` collection.
 * This Mongoose model is therefore pinned to the SAME `user` collection that
 * Better Auth manages (3rd arg to mongoose.model below) and only describes the
 * application-level fields the rest of the codebase relies on (role, premium,
 * profile, etc.). Better Auth keeps these in sync via `additionalFields`
 * (see src/config/auth.js).
 */
const mongoose = require('mongoose');

const PLACEHOLDER_IMAGE =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
      index: true,
    },
    // Set by Better Auth on email verification flows.
    emailVerified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: PLACEHOLDER_IMAGE,
    },
    role: {
      type: String,
      enum: {
        values: ['founder', 'collaborator', 'admin'],
        message: 'Role must be founder, collaborator or admin',
      },
      default: 'collaborator',
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    portfolio: {
      type: String,
      default: '',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    // Better Auth writes a few of its own fields directly via the native
    // driver; don't let Mongoose choke on unknown keys when hydrating.
    strict: false,
  }
);

userSchema.virtual('hasActivePremium').get(function () {
  if (!this.isPremium) return false;
  if (!this.premiumExpiresAt) return true;
  return this.premiumExpiresAt > new Date();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    // Defensive: never leak credential-ish fields if present.
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', { virtuals: true });

// IMPORTANT: pin to the singular `user` collection that Better Auth manages.
const User = mongoose.model('User', userSchema, 'user');

module.exports = User;
