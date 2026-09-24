import mongoose from 'mongoose';
import { Movie } from '../models/Movie.js';
import { Show } from '../models/Show.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import {
  isTmdbConfigured,
  searchTmdbMovies,
  getTmdbMovieDetails,
  mapTmdbToMovie,
} from '../services/tmdb.service.js';

const ALLOWED_FIELDS = [
  'title', 'description', 'poster', 'backdrop', 'trailer', 'language',
  'genre', 'duration', 'releaseDate', 'cast', 'rating', 'popularity',
  'status', 'active', 'tmdbId',
];

const pickFields = (body) => {
  const out = {};
  for (const k of ALLOWED_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
};

export const listMovies = asyncHandler(async (req, res) => {
  const { q, status, genre, language, page = 1, limit = 20, sort = 'newest' } = req.query;

  const filter = { active: true };
  if (status) filter.status = status;
  if (language) filter.language = language.toUpperCase();
  if (genre) filter.genre = { $in: [genre] };
  if (q) filter.$text = { $search: q };

  const sortMap = {
    newest: { releaseDate: -1 },
    rating: { rating: -1 },
    popularity: { popularity: -1 },
    title: { title: 1 },
  };

  const skip = (page - 1) * limit;
  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(sortMap[sort] || sortMap.newest).skip(skip).limit(limit),
    Movie.countDocuments(filter),
  ]);

  return ok(res, {
    movies,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie || !movie.active) throw ApiError.notFound('Movie not found');
  return ok(res, { movie });
});

export const createMovie = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body);
  const movie = await Movie.create(payload);
  return created(res, { movie }, 'Movie created');
});

export const updateMovie = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body);
  const movie = await Movie.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!movie) throw ApiError.notFound('Movie not found');
  return ok(res, { movie }, 'Movie updated');
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!movie) throw ApiError.notFound('Movie not found');

  // Soft-cancel future shows
  await Show.updateMany(
    { movie: movie._id, startTime: { $gt: new Date() }, status: 'SCHEDULED' },
    { $set: { status: 'CANCELLED' } }
  );

  return ok(res, null, 'Movie deactivated');
});

export const hardDeleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw ApiError.notFound('Movie not found');

  const futureShows = await Show.countDocuments({
    movie: movie._id,
    startTime: { $gt: new Date() },
  });
  if (futureShows > 0) {
    throw ApiError.conflict(
      `Cannot delete: ${futureShows} future show(s) exist for this movie. Cancel them first.`
    );
  }

  await Movie.findByIdAndDelete(movie._id);
  return ok(res, null, 'Movie permanently deleted');
});

// TMDB helpers -------------------------------------------------------------

export const tmdbStatus = asyncHandler(async (_req, res) => {
  return ok(res, { configured: isTmdbConfigured() });
});

export const tmdbSearch = asyncHandler(async (req, res) => {
  const { q, page } = req.query;
  if (!q) throw ApiError.badRequest('Query param "q" required');
  if (!isTmdbConfigured()) throw ApiError.badRequest('TMDB not configured on server');

  const data = await searchTmdbMovies(q, Number(page) || 1);
  return ok(res, {
    results: (data.results || []).map((m) => ({
      tmdbId: m.id,
      title: m.title,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
      releaseDate: m.release_date,
      rating: m.vote_average,
      overview: m.overview,
    })),
    totalPages: data.total_pages,
  });
});

export const tmdbImport = asyncHandler(async (req, res) => {
  const { tmdbId } = req.params;
  if (!isTmdbConfigured()) throw ApiError.badRequest('TMDB not configured on server');

  const existing = await Movie.findOne({ tmdbId: Number(tmdbId) });
  if (existing) return ok(res, { movie: existing }, 'Already imported');

  const details = await getTmdbMovieDetails(tmdbId);
  const movie = await Movie.create(mapTmdbToMovie(details));
  return created(res, { movie }, 'Movie imported from TMDB');
});

// Recommended for a movie (top rated, excluding self) ----------------------

export const recommendedMovies = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw ApiError.notFound('Movie not found');

  const or = [];
  if (movie.genre?.length) or.push({ genre: { $in: movie.genre } });
  if (movie.language) or.push({ language: movie.language });

  const filter = {
    _id: { $ne: movie._id },
    active: true,
    ...(or.length ? { $or: or } : {}),
  };

  const movies = await Movie.find(filter).sort({ rating: -1 }).limit(8);
  return ok(res, { movies });
});

// Prevent unused import warning (mongoose used elsewhere in some builds)
export const _unused = mongoose;