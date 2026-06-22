const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
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
    googleId: {
      type: String,
      sparse: true,
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
    delete ret.password;
    delete ret.googleId;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', { virtuals: true });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  if (!this.password || this.password.length === 0) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.findByEmailWithPassword = function findByEmailWithPassword(email) {
  return this.findOne({ email: String(email).toLowerCase() }).select('+password');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
