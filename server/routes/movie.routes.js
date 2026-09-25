import { Router } from 'express';
import {
  listMovies,
  getMovie,
  tmdbStatus,
  tmdbSearch,
  recommendedMovies,
} from '../controllers/movie.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  movieIdRule,
  listMovieRules,
} from '../validators/movie.validators.js';

export const movieRouter = Router();

movieRouter.get('/', listMovieRules, runValidation, listMovies);
movieRouter.get('/tmdb/status', tmdbStatus);
movieRouter.get('/tmdb/search', tmdbSearch);

movieRouter.get('/:id', movieIdRule, runValidation, optionalAuth, getMovie);
movieRouter.get('/:id/recommended', movieIdRule, runValidation, recommendedMovies);