import { body, param, query } from 'express-validator';

export const MAX_SEATS_PER_BOOKING = 5;

export const createBookingRules = [
  body('showId').isMongoId().withMessage('Invalid show id'),
  body('seats')
    .isArray({ min: 1, max: MAX_SEATS_PER_BOOKING })
    .withMessage(`Select between 1 and ${MAX_SEATS_PER_BOOKING} seats`),
  body('seats.*')
    .isString()
    .trim()
    .matches(/^[A-Z]{1,2}\d{1,3}$/)
    .withMessage('Invalid seat number format'),
];

export const bookingIdRule = [param('id').isMongoId().withMessage('Invalid booking id')];

export const listBookingRules = [
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'expired']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];