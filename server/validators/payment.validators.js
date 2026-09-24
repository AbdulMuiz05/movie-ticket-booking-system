import { body } from 'express-validator';

export const createIntentRules = [
  body('bookingId').isMongoId().withMessage('Invalid booking id'),
];

export const confirmPaymentRules = [
  body('paymentIntentId').isString().trim().isLength({ min: 5, max: 200 }),
];