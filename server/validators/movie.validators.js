import { body, param, query } from 'express-validator';

export const createMovieRules = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('description').isString().trim().isLength({ min: 1, max: 5000 }),
  body('poster').isString().trim().isLength({ min: 1, max: 1000 }),
  body('backdrop').optional().isString().isLength({ max: 1000 }),
  body('trailer').optional().isString().isLength({ max: 1000 }),
  body('language').isString().trim().isLength({ min: 2, max: 10 }),
  body('genre').optional().isArray(),
  body('duration').isInt({ min: 1, max: 600 }).toInt(),
  body('releaseDate').isISO8601().toDate(),
  body('cast').optional().isArray(),
  body('rating').optional().isFloat({ min: 0, max: 10 }).toFloat(),
  body('popularity').optional().isFloat({ min: 0 }).toFloat(),
  body('status').optional().isIn(['UPCOMING', 'NOW_SHOWING', 'ENDED']),
  body('active').optional().isBoolean().toBoolean(),
];

export const updateMovieRules = createMovieRules.map((rule) =>
  // make every field optional for updates
  rule.optional ? rule : rule.optional({ nullable: true }).optional()
);

export const movieIdRule = [param('id').isMongoId().withMessage('Invalid movie id')];

export const listMovieRules = [
  query('q').optional().isString().trim().isLength({ max: 120 }),
  query('status').optional().isIn(['UPCOMING', 'NOW_SHOWING', 'ENDED']),
  query('genre').optional().isString().trim(),
  query('language').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['newest', 'rating', 'popularity', 'title']),
];