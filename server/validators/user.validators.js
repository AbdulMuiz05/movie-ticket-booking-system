import { body, param } from 'express-validator';

export const updateProfileRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 80 }),
  body('phone').optional().isString().trim().isLength({ max: 20 }),
  body('avatar').optional().isString().isLength({ max: 500 }),
];

export const changePasswordRules = [
  body('currentPassword').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 6, max: 72 }),
];

export const movieIdParamRules = [param('movieId').isMongoId().withMessage('Invalid movie id')];