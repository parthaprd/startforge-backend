const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const paymentService = require('../services/payment.service');
const logger = require('../utils/logger');

const createCheckoutSession = asyncHandler(async (req, res) => {
  const result = await paymentService.createCheckoutSession(req.user, req.body);
  return ApiResponse.ok(res, 'Checkout session created.', result);
});

const webhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing stripe-signature header.' });
  }

  try {
    const event = paymentService.constructWebhookEvent(req.rawBody, signature);
    await paymentService.handleWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`Stripe webhook error: ${err.message}`);
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }
};

const verifyPremium = asyncHandler(async (req, res) => {
  const status = await paymentService.getPremiumStatus(req.user);
  return ApiResponse.ok(res, 'Premium status.', status);
});

const myTransactions = asyncHandler(async (req, res) => {
  const { docs, pagination } = await paymentService.listMyTransactions(req.user, req.query);
  return ApiResponse.paginated(res, 'Transactions fetched successfully.', docs, pagination);
});

module.exports = {
  createCheckoutSession,
  webhook,
  verifyPremium,
  myTransactions,
};
