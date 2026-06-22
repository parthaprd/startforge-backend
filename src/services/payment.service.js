const Payment = require('../models/Payment.model');
const Startup = require('../models/Startup.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { getStripeClient, PREMIUM_PACKAGE } = require('../config/stripe');
const { parsePagination, buildPagination } = require('../utils/pagination');

const PREMIUM_DURATION_DAYS = 30;

const buildSuccessUrl = () => `${process.env.CLIENT_URL}/payment/success`;
const buildCancelUrl = () => `${process.env.CLIENT_URL}/payment/cancel`;

const createCheckoutSession = async (user, body = {}) => {
  if (user.role !== 'founder') {
    throw ApiError.forbidden('Only founders can purchase premium access.');
  }

  const stripe = getStripeClient();

  const clientDollars = Number(body.price);
  const unitAmount =
    Number.isFinite(clientDollars) && clientDollars > 0
      ? Math.round(clientDollars * 100)
      : PREMIUM_PACKAGE.price;
  const productName = (body.name && String(body.name).trim()) || PREMIUM_PACKAGE.name;

  const lineItems = (process.env.PREMIUM_PRICE_ID && process.env.PREMIUM_PRICE_ID.startsWith('price_'))
    ? [{ price: process.env.PREMIUM_PRICE_ID, quantity: 1 }]
    : [
        {
          price_data: {
            currency: PREMIUM_PACKAGE.currency,
            product_data: {
              name: productName,
              description: PREMIUM_PACKAGE.description,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: user.email,
    client_reference_id: user._id.toString(),
    success_url: `${buildSuccessUrl()}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${buildCancelUrl()}?status=cancelled`,
    metadata: {
      user_id: user._id.toString(),
      user_email: user.email,
      package_type: 'premium_monthly',
    },
  });

  return { url: session.url, session_id: session.id };
};

const constructWebhookEvent = (rawBody, signature) => {
  const stripe = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw ApiError.internal('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
};

const handleCheckoutCompleted = async (session) => {
  const email = session.customer_email || (session.metadata && session.metadata.user_email);
  const userId = session.client_reference_id || (session.metadata && session.metadata.user_id);

  if (!email) {
    logger.error('Webhook: checkout.session.completed missing customer email.', {
      session_id: session.id,
    });
    return;
  }

  const existing = await Payment.findOne({ transaction_id: session.id });
  if (existing) {
    logger.info(`Webhook: session ${session.id} already processed. Skipping.`);
    return existing;
  }

  const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : 0;

  const payment = await Payment.create({
    user_email: email.toLowerCase(),
    amount: amountTotal / 100,
    currency: session.currency || 'usd',
    transaction_id: session.id,
    payment_status:
      session.payment_status === 'paid' ? 'succeeded' : session.payment_status || 'pending',
    package_type: 'premium_monthly',
    paid_at: new Date(),
  });

  const premiumExpiresAt = new Date();
  premiumExpiresAt.setDate(premiumExpiresAt.getDate() + PREMIUM_DURATION_DAYS);

  await User.findByIdAndUpdate(userId || { email: email.toLowerCase() }, {
    $set: { isPremium: true, premiumExpiresAt },
  });

  logger.info(`Webhook: premium activated for ${email} until ${premiumExpiresAt.toISOString()}`);
  return payment;
};

const handleWebhookEvent = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    default:
      logger.debug(`Webhook: unhandled event type ${event.type}`);
      break;
  }
};

const getPremiumStatus = async (user) => {
  if (user.role !== 'founder') {
    throw ApiError.forbidden('Only founders have premium status.');
  }
  const fresh = await User.findById(user._id);
  return {
    isPremium: fresh.isPremium,
    premiumExpiresAt: fresh.premiumExpiresAt,
    active: fresh.hasActivePremium,
    hasStartup: !!(await Startup.findOne({ founder_email: user.email })),
  };
};

const listMyTransactions = async (user, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user_email: user.email };

  const [count, docs] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return { docs, pagination: buildPagination(count, page, limit) };
};

module.exports = {
  createCheckoutSession,
  constructWebhookEvent,
  handleWebhookEvent,
  getPremiumStatus,
  listMyTransactions,
  PREMIUM_PACKAGE,
  PREMIUM_DURATION_DAYS,
};
