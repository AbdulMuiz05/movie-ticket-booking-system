import { Router } from 'express';
import {
  listShows,
  getShow,
  createShow,
  updateShow,
  cancelShow,
  deleteShow,
  availableDatesForMovie,
  occupiedSeatsForShow,
} from '../controllers/show.controller.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  createShowRules,
  updateShowRules,
  showIdRule,
  listShowRules,
} from '../validators/show.validators.js';

export const showRouter = Router();

showRouter.get('/', listShowRules, runValidation, listShows);
showRouter.get('/movie/:movieId/dates', availableDatesForMovie);
showRouter.get('/:id', showIdRule, runValidation, getShow);
showRouter.get('/:id/occupied-seats', showIdRule, runValidation, occupiedSeatsForShow);

showRouter.post('/', authenticate, requireAdmin, createShowRules, runValidation, createShow);
showRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  updateShowRules,
  runValidation,
  updateShow
);
showRouter.post(
  '/:id/cancel',
  authenticate,
  requireAdmin,
  showIdRule,
  runValidation,
  cancelShow
);
showRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  showIdRule,
  runValidation,
  deleteShow
);

export const _unusedOptionalAuth = optionalAuth;