import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getDashboardStats,
  listUsers,
  updateUserRole,
  setUserActive,
  listAllBookings,
  listAllShows,
  listPayments,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';

export const adminRouter = Router();

// Every route in here requires an authenticated ADMIN.
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/dashboard', getDashboardStats);

adminRouter.get('/users', listUsers);
adminRouter.patch(
  '/users/:id/role',
  [param('id').isMongoId(), body('role').isIn(['USER', 'ADMIN'])],
  runValidation,
  updateUserRole
);
adminRouter.patch(
  '/users/:id/active',
  [param('id').isMongoId(), body('active').isBoolean().toBoolean()],
  runValidation,
  setUserActive
);

adminRouter.get('/bookings', listAllBookings);
adminRouter.get('/shows', listAllShows);
adminRouter.get('/payments', listPayments);