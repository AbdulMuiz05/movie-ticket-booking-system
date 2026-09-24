import { Router } from 'express';
import {
  listSeatsByScreen,
  createSeat,
  updateSeat,
  deleteSeat,
} from '../controllers/seat.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  createSeatRules,
  updateSeatRules,
  seatIdRule,
  listSeatsByScreenRules,
} from '../validators/seat.validators.js';

export const seatRouter = Router();

seatRouter.get(
  '/screen/:screenId',
  listSeatsByScreenRules,
  runValidation,
  listSeatsByScreen
);

seatRouter.post('/', authenticate, requireAdmin, createSeatRules, runValidation, createSeat);
seatRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  updateSeatRules,
  runValidation,
  updateSeat
);
seatRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  seatIdRule,
  runValidation,
  deleteSeat
);