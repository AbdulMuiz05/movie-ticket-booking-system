import { param, query } from 'express-validator';

export const movieIdRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid TMDB movie id').toInt(),
];

export const listMovieRules = [
  query('q').optional().isString().trim().isLength({ max: 120 }),
  query('status').optional().isIn(['UPCOMING', 'NOW_SHOWING', 'ENDED']),
  query('genre').optional().isString().trim(),
  query('language').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['newest', 'rating', 'popularity', 'title']),
];