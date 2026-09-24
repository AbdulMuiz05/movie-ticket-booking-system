import { Router } from 'express';
import {
  createBooking,
  getBooking,
  listMyBookings,
  cancelBooking,
  retryInfo,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  createBookingRules,
  bookingIdRule,
  listBookingRules,
} from '../validators/booking.validators.js';

export const bookingRouter = Router();

bookingRouter.use(authenticate);

bookingRouter.post('/', createBookingRules, runValidation, createBooking);
bookingRouter.get('/me', listBookingRules, runValidation, listMyBookings);
bookingRouter.get('/:id', bookingIdRule, runValidation, getBooking);
bookingRouter.get('/:id/retry-info', bookingIdRule, runValidation, retryInfo);
bookingRouter.post('/:id/cancel', bookingIdRule, runValidation, cancelBooking);