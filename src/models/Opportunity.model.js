const mongoose = require('mongoose');

const WORK_TYPES = ['Remote', 'On-site', 'Hybrid'];
const COMMITMENT_LEVELS = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const opportunitySchema = new mongoose.Schema(
  {
    startup_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: [true, 'Startup reference is required'],
      index: true,
    },
    role_title: {
      type: String,
      required: [true, 'Role title is required'],
      trim: true,
      maxlength: [100, 'Role title cannot exceed 100 characters'],
    },
    required_skills: {
      type: [String],
      required: [true, 'At least one required skill is needed'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one required skill is needed',
      },
    },
    work_type: {
      type: String,
      enum: {
        values: WORK_TYPES,
        message: 'Work type is invalid',
      },
      default: 'Remote',
      index: true,
    },
    commitment_level: {
      type: String,
      enum: {
        values: COMMITMENT_LEVELS,
        message: 'Commitment level is invalid',
      },
      default: 'Full-time',
      index: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      index: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

opportunitySchema.index({ startup_id: 1, createdAt: -1 });

opportunitySchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;
module.exports.WORK_TYPES = WORK_TYPES;
module.exports.COMMITMENT_LEVELS = COMMITMENT_LEVELS;
