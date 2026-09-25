import { Router } from 'express';
import {
  listShows,
  getShow,
  createShow,
  updateShow,
  deleteShow,
} from '../controllers/show.controller.js';
import {
  authenticate,
  requireAdmin,
} from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  showIdRule,
  listShowRules,
  createShowRules,
  updateShowRules,
} from '../validators/show.validators.js';

export const showRouter = Router();

showRouter.get(
  '/',
  listShowRules,
  runValidation,
  listShows
);

showRouter.get(
  '/:id',
  showIdRule,
  runValidation,
  getShow
);

showRouter.post(
  '/',
  authenticate,
  requireAdmin,
  createShowRules,
  runValidation,
  createShow
);

showRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  showIdRule,
  updateShowRules,
  runValidation,
  updateShow
);

showRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  showIdRule,
  runValidation,
  deleteShow
);