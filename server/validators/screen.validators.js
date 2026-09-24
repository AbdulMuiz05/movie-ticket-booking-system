import { body, param } from 'express-validator';

export const createScreenRules = [
  param('cinemaId').isMongoId().withMessage('Invalid cinema id'),
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('screenNumber').isInt({ min: 1 }).toInt(),
  body('rows').isInt({ min: 1, max: 50 }).toInt(),
  body('columns').isInt({ min: 1, max: 60 }).toInt(),
  body('screenType').optional().isIn(['STANDARD', 'IMAX', '3D', '4DX', 'DOLBY']),
  body('seatConfiguration').optional().isArray(),
  body('active').optional().isBoolean().toBoolean(),
];

export const updateScreenRules = [
  param('id').isMongoId(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('screenNumber').optional().isInt({ min: 1 }).toInt(),
  body('screenType').optional().isIn(['STANDARD', 'IMAX', '3D', '4DX', 'DOLBY']),
  body('seatConfiguration').optional().isArray(),
  body('active').optional().isBoolean().toBoolean(),
];

export const screenIdRule = [param('id').isMongoId().withMessage('Invalid screen id')];