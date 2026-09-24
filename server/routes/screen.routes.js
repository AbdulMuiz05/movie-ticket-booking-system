import { Router } from 'express';
import {
  listScreensByCinema,
  getScreen,
  createScreen,
  updateScreen,
  deleteScreen,
  hardDeleteScreen,
  regenerateSeats,
} from '../controllers/screen.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  createScreenRules,
  updateScreenRules,
  screenIdRule,
} from '../validators/screen.validators.js';

export const screenRouter = Router();

screenRouter.get('/cinema/:cinemaId', listScreensByCinema);
screenRouter.get('/:id', screenIdRule, runValidation, getScreen);

screenRouter.post(
  '/cinema/:cinemaId',
  authenticate,
  requireAdmin,
  createScreenRules,
  runValidation,
  createScreen
);
screenRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  updateScreenRules,
  runValidation,
  updateScreen
);
screenRouter.post(
  '/:id/regenerate-seats',
  authenticate,
  requireAdmin,
  screenIdRule,
  runValidation,
  regenerateSeats
);
screenRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  screenIdRule,
  runValidation,
  deleteScreen
);
screenRouter.delete(
  '/:id/permanent',
  authenticate,
  requireAdmin,
  screenIdRule,
  runValidation,
  hardDeleteScreen
);