import { body, param, query } from 'express-validator';

export const createShowRules = [
  body('movie').isMongoId(),
  body('cinema').isMongoId(),
  body('screen').isMongoId(),
  body('date').isISO8601().toDate(),
  body('startTime').isISO8601().toDate(),
  body('endTime').optional().isISO8601().toDate(),
  body('ticketPrice').isFloat({ min: 0 }).toFloat(),
  body('status').optional().isIn(['SCHEDULED', 'CANCELLED', 'COMPLETED']),
];

export const updateShowRules = [
  param('id').isMongoId(),
  body('date').optional().isISO8601().toDate(),
  body('startTime').optional().isISO8601().toDate(),
  body('endTime').optional().isISO8601().toDate(),
  body('ticketPrice').optional().isFloat({ min: 0 }).toFloat(),
  body('status').optional().isIn(['SCHEDULED', 'CANCELLED', 'COMPLETED']),
];

export const showIdRule = [param('id').isMongoId().withMessage('Invalid show id')];

export const listShowRules = [
  query('movieId').optional().isMongoId(),
  query('cinemaId').optional().isMongoId(),
  query('date').optional().isISO8601(),
  query('status').optional().isIn(['SCHEDULED', 'CANCELLED', 'COMPLETED']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];