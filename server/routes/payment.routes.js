import { Router } from 'express';
import {
  createIntent,
  confirmPayment,
  getPaymentStatus,
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import { paymentLimiter } from '../middleware/rateLimit.middleware.js';
import {
  createIntentRules,
  confirmPaymentRules,
} from '../validators/payment.validators.js';

export const paymentRouter = Router();

paymentRouter.use(authenticate);

paymentRouter.post(
  '/intent',
  paymentLimiter,
  createIntentRules,
  runValidation,
  createIntent
);

paymentRouter.post(
  '/confirm',
  paymentLimiter,
  confirmPaymentRules,
  runValidation,
  confirmPayment
);

paymentRouter.get('/status/:paymentIntentId', getPaymentStatus);