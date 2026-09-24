import { body, param, query } from 'express-validator';

export const seatIdRule = [param('id').isMongoId().withMessage('Invalid seat id')];

export const createSeatRules = [
  body('screen').isMongoId(),
  body('seatNumber').isString().trim().isLength({ min: 1, max: 10 }),
  body('row').isString().trim().isLength({ min: 1, max: 4 }),
  body('column').isInt({ min: 1 }).toInt(),
  body('seatType').optional().isIn(['REGULAR', 'PREMIUM', 'RECLINER']),
  body('priceMultiplier').optional().isFloat({ min: 1 }).toFloat(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']),
];

export const updateSeatRules = [
  param('id').isMongoId(),
  body('seatType').optional().isIn(['REGULAR', 'PREMIUM', 'RECLINER']),
  body('priceMultiplier').optional().isFloat({ min: 1 }).toFloat(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']),
];

export const listSeatsByScreenRules = [param('screenId').isMongoId()];