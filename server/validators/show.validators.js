import { body, param, query } from 'express-validator';

export const showIdRule = [
  param('id').isMongoId().withMessage('Invalid show id'),
];

export const listShowRules = [
  query('movieId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid TMDB movie id')
    .toInt(),
  query('cinemaId')
    .optional()
    .isMongoId()
    .withMessage('Invalid cinema id'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date'),
  query('status')
    .optional()
    .isIn(['SCHEDULED', 'CANCELLED', 'COMPLETED'])
    .withMessage('Invalid show status'),
];

export const createShowRules = [
  body('tmdbMovieId')
    .isInt({ min: 1 })
    .withMessage('Valid TMDB movie id is required')
    .toInt(),
  body('cinema')
    .isMongoId()
    .withMessage('Valid cinema id is required'),
  body('screen')
    .isMongoId()
    .withMessage('Valid screen id is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time is required'),
  body('endTime')
    .isISO8601()
    .withMessage('Valid end time is required'),
  body('ticketPrice')
    .isFloat({ min: 0 })
    .withMessage('Ticket price must be a non-negative number')
    .toFloat(),
  body('totalSeats')
    .isInt({ min: 1 })
    .withMessage('Total seats must be at least 1')
    .toInt(),
];

export const updateShowRules = [
  body('tmdbMovieId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid TMDB movie id')
    .toInt(),
  body('cinema')
    .optional()
    .isMongoId()
    .withMessage('Invalid cinema id'),
  body('screen')
    .optional()
    .isMongoId()
    .withMessage('Invalid screen id'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid start time'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid end time'),
  body('ticketPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ticket price must be a non-negative number')
    .toFloat(),
  body('totalSeats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total seats must be at least 1')
    .toInt(),
  body('status')
    .optional()
    .isIn(['SCHEDULED', 'CANCELLED', 'COMPLETED'])
    .withMessage('Invalid show status'),
];