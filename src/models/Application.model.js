const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    opportunity_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: [true, 'Opportunity reference is required'],
      index: true,
    },
    applicant_email: {
      type: String,
      required: [true, 'Applicant email is required'],
      lowercase: true,
      trim: true,
      ref: 'User',
      index: true,
    },
    portfolio_link: {
      type: String,
      default: '',
      trim: true,
    },
    motivation: {
      type: String,
      required: [true, 'Motivation is required'],
      maxlength: [1000, 'Motivation cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    applied_at: {
      type: Date,
      default: Date.now,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  { opportunity_id: 1, applicant_email: 1 },
  { unique: true }
);

applicationSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
