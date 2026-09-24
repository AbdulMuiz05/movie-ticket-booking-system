import { Router } from 'express';
import {
  listCinemas,
  listCities,
  getCinema,
  createCinema,
  updateCinema,
  deleteCinema,
  hardDeleteCinema,
} from '../controllers/cinema.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  createCinemaRules,
  updateCinemaRules,
  cinemaIdRule,
  listCinemaRules,
} from '../validators/cinema.validators.js';

export const cinemaRouter = Router();

cinemaRouter.get('/', listCinemaRules, runValidation, listCinemas);
cinemaRouter.get('/cities', listCities);
cinemaRouter.get('/:id', cinemaIdRule, runValidation, getCinema);

cinemaRouter.post(
  '/',
  authenticate,
  requireAdmin,
  createCinemaRules,
  runValidation,
  createCinema
);
cinemaRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  updateCinemaRules,
  runValidation,
  updateCinema
);
cinemaRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  cinemaIdRule,
  runValidation,
  deleteCinema
);
cinemaRouter.delete(
  '/:id/permanent',
  authenticate,
  requireAdmin,
  cinemaIdRule,
  runValidation,
  hardDeleteCinema
);