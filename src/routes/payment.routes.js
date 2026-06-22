/**
 * Payment routes.
 *
 *   POST /create-checkout-session   founder
 *   POST /webhook                   public (Stripe) - raw body
 *   GET  /verify-premium            founder
 *   GET  /my-transactions           founder
 *
 * IMPORTANT: the webhook route registers its OWN raw-body parser so the
 * signature can be verified. Express's main JSON parser must NOT consume
 * the webhook body.
 */
const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isFounder } = require('../middlewares/rbac.middleware');

// Stripe webhook - must be registered before protect/json to access raw body.
// We use express.raw to capture the body as a Buffer on req.rawBody.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.webhook
);

// Founder-only endpoints.
router.post('/create-checkout-session', protect, isFounder, paymentController.createCheckoutSession);
router.get('/verify-premium', protect, isFounder, paymentController.verifyPremium);
router.get('/my-transactions', protect, isFounder, paymentController.myTransactions);

module.exports = router;
