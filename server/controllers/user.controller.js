import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import {
  getTmdbMovieDetails,
  mapTmdbToMovie,
} from '../services/tmdb.service.js';

const parseTmdbId = (value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid TMDB movie id');
  }

  return id;
};

const loadFavoriteMovies = async (ids) => {
  const movies = await Promise.all(
    ids.map(async (id) => {
      try {
        return mapTmdbToMovie(await getTmdbMovieDetails(id));
      } catch {
        return null;
      }
    })
  );

  return movies.filter(Boolean);
};

export const getProfile = asyncHandler(async (req, res) => {
  return ok(
    res,
    { user: req.user.toSafeJSON() },
    'Profile fetched'
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  return ok(
    res,
    { user: user.toSafeJSON() },
    'Profile updated'
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const matches = await user.comparePassword(currentPassword);

  if (!matches) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;

  await user.save();

  return ok(res, null, 'Password changed');
});

export const listFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('favoriteTmdbIds');

  const favorites = await loadFavoriteMovies(
    user.favoriteTmdbIds || []
  );

  return ok(
    res,
    { favorites },
    'Favorites fetched'
  );
});

export const addFavorite = asyncHandler(async (req, res) => {
  const movieId = parseTmdbId(req.params.movieId);

  const user = await User.findById(req.user._id);

  if (!user.favoriteTmdbIds.includes(movieId)) {
    user.favoriteTmdbIds.push(movieId);
  }

  await user.save();

  const favorites = await loadFavoriteMovies(
    user.favoriteTmdbIds
  );

  return ok(
    res,
    {
      favorites,
      isFavorite: true,
    },
    'Added to favorites'
  );
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const movieId = parseTmdbId(req.params.movieId);

  const user = await User.findById(req.user._id);

  user.favoriteTmdbIds = user.favoriteTmdbIds.filter(
    (id) => id !== movieId
  );

  await user.save();

  const favorites = await loadFavoriteMovies(
    user.favoriteTmdbIds
  );

  return ok(
    res,
    {
      favorites,
      isFavorite: false,
    },
    'Removed from favorites'
  );
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const movieId = parseTmdbId(req.params.movieId);

  const user = await User.findById(req.user._id);

  const has = user.favoriteTmdbIds.includes(movieId);

  user.favoriteTmdbIds = has
    ? user.favoriteTmdbIds.filter((id) => id !== movieId)
    : [...user.favoriteTmdbIds, movieId];

  await user.save();

  const favorites = await loadFavoriteMovies(
    user.favoriteTmdbIds
  );

  return ok(
    res,
    {
      favorites,
      isFavorite: !has,
    },
    has ? 'Removed from favorites' : 'Added to favorites'
  );
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const confirmedBookings = await Booking.countDocuments({
    user: req.user._id,
    bookingStatus: 'confirmed',
  });

  if (confirmedBookings > 0) {
    throw ApiError.conflict(
      'Cancel or refund confirmed bookings before deleting your account'
    );
  }

  await User.findByIdAndDelete(req.user._id);

  return ok(res, null, 'Account deleted');
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .populate({
      path: 'cinema',
      select: 'name city address',
    })
    .populate({
      path: 'screen',
      select: 'name screenNumber screenType',
    })
    .populate({
      path: 'show',
      select: 'date startTime endTime ticketPrice',
    });

  return ok(
    res,
    { bookings },
    'Bookings fetched'
  );
});