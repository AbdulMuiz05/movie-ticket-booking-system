import { Router } from 'express';
import {
  listMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  hardDeleteMovie,
  tmdbStatus,
  tmdbSearch,
  tmdbImport,
  recommendedMovies,
} from '../controllers/movie.controller.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';
import { runValidation } from '../middleware/validate.middleware.js';
import {
  createMovieRules,
  updateMovieRules,
  movieIdRule,
  listMovieRules,
} from '../validators/movie.validators.js';

export const movieRouter = Router();

movieRouter.get('/', listMovieRules, runValidation, listMovies);
movieRouter.get('/tmdb/status', tmdbStatus);
movieRouter.get('/tmdb/search', tmdbSearch);
movieRouter.post('/tmdb/import/:tmdbId', authenticate, requireAdmin, tmdbImport);

movieRouter.get('/:id', movieIdRule, runValidation, optionalAuth, getMovie);
movieRouter.get('/:id/recommended', movieIdRule, runValidation, recommendedMovies);

movieRouter.post('/', authenticate, requireAdmin, createMovieRules, runValidation, createMovie);
movieRouter.patch('/:id', authenticate, requireAdmin, updateMovieRules, runValidation, updateMovie);
movieRouter.delete('/:id', authenticate, requireAdmin, movieIdRule, runValidation, deleteMovie);
movieRouter.delete(
  '/:id/permanent',
  authenticate,
  requireAdmin,
  movieIdRule,
  runValidation,
  hardDeleteMovie
);