const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'succeeded', 'failed'];

const paymentSchema = new mongoose.Schema(
  {
    user_email: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
      ref: 'User',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'usd',
    },
    transaction_id: {
      type: String,
      required: [true, 'Transaction id is required'],
      index: true,
    },
    payment_status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
      index: true,
    },
    package_type: {
      type: String,
      default: 'premium_monthly',
    },
    paid_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
