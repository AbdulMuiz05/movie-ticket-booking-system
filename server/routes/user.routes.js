import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  listFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  listMyBookings,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  updateProfileRules,
  changePasswordRules,
  movieIdParamRules,
} from '../validators/user.validators.js';

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/profile', getProfile);
userRouter.patch('/profile', updateProfileRules, runValidation, updateProfile);
userRouter.patch('/password', changePasswordRules, runValidation, changePassword);

userRouter.get('/favorites', listFavorites);
userRouter.post('/favorites/:movieId', movieIdParamRules, runValidation, addFavorite);
userRouter.delete('/favorites/:movieId', movieIdParamRules, runValidation, removeFavorite);
userRouter.post('/favorites/:movieId/toggle', movieIdParamRules, runValidation, toggleFavorite);

userRouter.get('/bookings', listMyBookings);