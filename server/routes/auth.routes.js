import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { registerRules, loginRules } from '../validators/auth.validators.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, registerRules, runValidation, register);
authRouter.post('/login', authLimiter, loginRules, runValidation, login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);