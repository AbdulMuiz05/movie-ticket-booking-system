import { body } from 'express-validator';

export const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 chars'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isString().isLength({ min: 6, max: 72 }).withMessage('Password must be 6–72 chars'),
  body('phone').optional().isString().trim().isLength({ max: 20 }),
];

export const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password required'),
];