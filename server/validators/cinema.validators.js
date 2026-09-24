import { body, param, query } from 'express-validator';

const cinemaFields = {
  name: body('name').isString().trim().isLength({ min: 2, max: 150 }),
  description: body('description').optional().isString().isLength({ max: 2000 }),
  address: body('address').isString().trim().isLength({ min: 3, max: 500 }),
  city: body('city').isString().trim().isLength({ min: 2, max: 100 }),
  state: body('state').optional().isString().isLength({ max: 100 }),
  postalCode: body('postalCode').optional().isString().isLength({ max: 20 }),
  country: body('country').optional().isString().isLength({ max: 60 }),
  lat: body('lat').optional().isFloat({ min: -90, max: 90 }).toFloat(),
  lng: body('lng').optional().isFloat({ min: -180, max: 180 }).toFloat(),
  facilities: body('facilities').optional().isArray(),
  images: body('images').optional().isArray(),
  active: body('active').optional().isBoolean().toBoolean(),
};

export const createCinemaRules = Object.values(cinemaFields);

export const updateCinemaRules = Object.entries(cinemaFields).map(([key, rule]) =>
  key === 'name' || key === 'address' || key === 'city' ? rule.optional() : rule
);

export const cinemaIdRule = [param('id').isMongoId().withMessage('Invalid cinema id')];

export const listCinemaRules = [
  query('city').optional().isString().trim(),
  query('q').optional().isString().trim().isLength({ max: 120 }),
  query('active').optional().isBoolean().toBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];