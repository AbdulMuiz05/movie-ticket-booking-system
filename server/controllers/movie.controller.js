import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import {
  getTmdbMovieDetails,
  getTmdbRecommendations,
  isTmdbConfigured,
  listTmdbMovies,
  searchTmdbMovies,
  mapTmdbToMovie,
} from '../services/tmdb.service.js';

const tmdbId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest('Invalid TMDB movie id');
  return id;
};

export const listMovies = asyncHandler(async (req, res) => {
  const { q, status, page = 1, limit = 20, sort = 'newest' } = req.query;

  if (status === 'ENDED') {
    return ok(res, {
      movies: [],
      pagination: { page, limit, total: 0, pages: 0 },
    });
  }

  const result = await listTmdbMovies({
    q,
    status,
    page: Number(page) || 1,
  });

  const requestedLimit = Number(limit) || 20;

  const movies = [...result.movies]
    .sort((a, b) => {
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
      if (sort === 'title') return a.title.localeCompare(b.title);

      return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
    })
    .slice(0, requestedLimit);

  return ok(res, {
    movies,
    pagination: {
      page: result.page,
      limit: requestedLimit,
      total: result.total,
      pages: result.pages,
    },
  });
});

export const getMovie = asyncHandler(async (req, res) => {
  const details = await getTmdbMovieDetails(tmdbId(req.params.id));

  return ok(res, {
    movie: mapTmdbToMovie(details),
  });
});

export const recommendedMovies = asyncHandler(async (req, res) => {
  const result = await getTmdbRecommendations(tmdbId(req.params.id));

  return ok(res, {
    movies: result.movies.slice(0, 8),
  });
});

export const tmdbStatus = asyncHandler(async (_req, res) => {
  return ok(res, {
    configured: isTmdbConfigured(),
  });
});

export const tmdbSearch = asyncHandler(async (req, res) => {
  const { q, page } = req.query;

  if (!q) {
    throw ApiError.badRequest('Query param "q" required');
  }

  if (!isTmdbConfigured()) {
    throw ApiError.badRequest('TMDB not configured on server');
  }

  const data = await searchTmdbMovies(q, Number(page) || 1);

  return ok(res, data);
});