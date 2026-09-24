import { Router } from 'express';
import { sweep } from '../controllers/jobs.controller.js';

export const jobsRouter = Router();

jobsRouter.post('/sweep', sweep);
jobsRouter.get('/sweep', sweep);