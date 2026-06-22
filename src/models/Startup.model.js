const mongoose = require('mongoose');

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Marketing',
  'Real Estate',
  'Other',
];

const FUNDING_STAGES = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Bootstrapped',
];

const startupSchema = new mongoose.Schema(
  {
    startup_name: {
      type: String,
      required: [true, 'Startup name is required'],
      trim: true,
      maxlength: [100, 'Startup name cannot exceed 100 characters'],
    },
    logo: {
      type: String,
      required: [true, 'Logo URL is required'],
      trim: true,
    },
    industry: {
      type: String,
      enum: {
        values: INDUSTRIES,
        message: 'Industry is invalid',
      },
      default: 'Other',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    funding_stage: {
      type: String,
      enum: {
        values: FUNDING_STAGES,
        message: 'Funding stage is invalid',
      },
      default: 'Bootstrapped',
    },
    founder_email: {
      type: String,
      required: [true, 'Founder email is required'],
      lowercase: true,
      trim: true,
      ref: 'User',
      index: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    team_size: {
      type: Number,
      default: 0,
      min: [0, 'Team size cannot be negative'],
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

startupSchema.index({ startup_name: 'text', description: 'text' });

startupSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Startup = mongoose.model('Startup', startupSchema);

module.exports = Startup;
module.exports.INDUSTRIES = INDUSTRIES;
module.exports.FUNDING_STAGES = FUNDING_STAGES;
