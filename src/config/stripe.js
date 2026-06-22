const Stripe = require('stripe');
const logger = require('../utils/logger');

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  logger.warn(
    'STRIPE_SECRET_KEY is not set. Payment endpoints will not function until it is configured.'
  );
}

const getStripeClient = () => {
  if (!secretKey) {
    const err = new Error('Stripe is not configured (STRIPE_SECRET_KEY missing).');
    err.statusCode = 503;
    throw err;
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
    appInfo: { name: 'StartupForge', version: '1.0.0' },
  });
};

const PREMIUM_PACKAGE = {
  name: 'Premium Founder',
  price: 2900,
  currency: 'usd',
  description: 'Unlimited opportunity posts + priority support',
  features: [
    'Unlimited opportunity posts',
    'Priority applicant listing',
    'Advanced analytics',
    '24/7 support',
  ],
};

module.exports = {
  getStripeClient,
  PREMIUM_PACKAGE,
};
