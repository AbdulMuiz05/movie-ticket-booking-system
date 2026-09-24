import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const getProfile = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toSafeJSON() }, 'Profile fetched');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  return ok(res, { user: user.toSafeJSON() }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword;
  await user.save();

  return ok(res, null, 'Password changed');
});

// Favorites ---------------------------------------------------------------

export const listFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  return ok(res, { favorites: user.favorites || [] }, 'Favorites fetched');
});

export const addFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  if (!mongoose.isValidObjectId(movieId)) throw ApiError.badRequest('Invalid movie id');

  const movie = await Movie.findById(movieId);
  if (!movie) throw ApiError.notFound('Movie not found');

  await User.updateOne({ _id: req.user._id }, { $addToSet: { favorites: movieId } });
  const user = await User.findById(req.user._id).populate('favorites');

  return ok(res, { favorites: user.favorites }, 'Added to favorites');
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  if (!mongoose.isValidObjectId(movieId)) throw ApiError.badRequest('Invalid movie id');

  await User.updateOne({ _id: req.user._id }, { $pull: { favorites: movieId } });
  const user = await User.findById(req.user._id).populate('favorites');

  return ok(res, { favorites: user.favorites }, 'Removed from favorites');
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  if (!mongoose.isValidObjectId(movieId)) throw ApiError.badRequest('Invalid movie id');

  const movie = await Movie.findById(movieId);
  if (!movie) throw ApiError.notFound('Movie not found');

  const user = await User.findById(req.user._id);
  const has = user.favorites.some((id) => id.toString() === movieId);

  if (has) {
    user.favorites = user.favorites.filter((id) => id.toString() !== movieId);
  } else {
    user.favorites.push(movieId);
  }
  await user.save();

  await user.populate('favorites');
  return ok(res, { favorites: user.favorites, isFavorite: !has }, has ? 'Removed from favorites' : 'Added to favorites');
});

// Bookings ----------------------------------------------------------------

export const listMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('movie')
    .populate({ path: 'cinema', select: 'name city address' })
    .populate({ path: 'screen', select: 'name screenNumber screenType' })
    .populate({ path: 'show', select: 'date startTime endTime ticketPrice' });

  return ok(res, { bookings }, 'Bookings fetched');
});