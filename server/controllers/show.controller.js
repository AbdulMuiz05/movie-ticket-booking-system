import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { Show } from '../models/Show.js';
import { getTmdbMovieDetails, mapTmdbToMovie } from '../services/tmdb.service.js';

export const listShows = asyncHandler(async (req, res) => {
  const { movieId, cinemaId, date, status = 'SCHEDULED' } = req.query;

  const filter = { status };

  if (movieId) {
    const tmdbMovieId = Number(movieId);

    if (!Number.isInteger(tmdbMovieId) || tmdbMovieId <= 0) {
      throw ApiError.badRequest('Invalid TMDB movie id');
    }

    filter['movie.tmdbId'] = tmdbMovieId;
  }

  if (cinemaId) {
    filter.cinema = cinemaId;
  }

  if (date) {
    const start = new Date(date);

    if (Number.isNaN(start.getTime())) {
      throw ApiError.badRequest('Invalid date');
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    filter.startTime = {
      $gte: start,
      $lt: end,
    };
  }

  const shows = await Show.find(filter)
    .populate('cinema')
    .populate('screen')
    .sort({ startTime: 1 })
    .lean({ virtuals: true });

  return ok(res, { shows });
});

export const getShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('cinema')
    .populate('screen')
    .lean({ virtuals: true });

  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  return ok(res, { show });
});

export const createShow = asyncHandler(async (req, res) => {
  const {
    tmdbMovieId,
    cinema,
    screen,
    date,
    startTime,
    endTime,
    ticketPrice,
    totalSeats,
  } = req.body;

  if (!tmdbMovieId) {
    throw ApiError.badRequest('TMDB movie id is required');
  }

  const movieDetails = await getTmdbMovieDetails(Number(tmdbMovieId));
  const movie = mapTmdbToMovie(movieDetails);

  const show = await Show.create({
    movie: {
      tmdbId: movie.tmdbId,
      title: movie.title,
      poster: movie.poster,
      backdrop: movie.backdrop,
      duration: movie.duration,
      language: movie.language,
      rating: movie.rating,
      genre: movie.genre,
    },
    cinema,
    screen,
    date,
    startTime,
    endTime,
    ticketPrice,
    totalSeats,
  });

  return ok(res, { show }, 201);
});

export const updateShow = asyncHandler(async (req, res) => {
  const {
    tmdbMovieId,
    cinema,
    screen,
    date,
    startTime,
    endTime,
    ticketPrice,
    totalSeats,
    status,
  } = req.body;

  const show = await Show.findById(req.params.id);

  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  if (tmdbMovieId && Number(tmdbMovieId) !== show.movie.tmdbId) {
    const movieDetails = await getTmdbMovieDetails(Number(tmdbMovieId));
    const movie = mapTmdbToMovie(movieDetails);

    show.movie = {
      tmdbId: movie.tmdbId,
      title: movie.title,
      poster: movie.poster,
      backdrop: movie.backdrop,
      duration: movie.duration,
      language: movie.language,
      rating: movie.rating,
      genre: movie.genre,
    };
  }

  if (cinema !== undefined) show.cinema = cinema;
  if (screen !== undefined) show.screen = screen;
  if (date !== undefined) show.date = date;
  if (startTime !== undefined) show.startTime = startTime;
  if (endTime !== undefined) show.endTime = endTime;
  if (ticketPrice !== undefined) show.ticketPrice = ticketPrice;
  if (totalSeats !== undefined) show.totalSeats = totalSeats;
  if (status !== undefined) show.status = status;

  await show.save();

  return ok(res, { show });
});

export const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);

  if (!show) {
    throw ApiError.notFound('Show not found');
  }

  if (show.occupiedSeats?.length) {
    throw ApiError.badRequest('Cannot delete a show with occupied seats');
  }

  await show.deleteOne();

  return ok(res, { message: 'Show deleted successfully' });
});