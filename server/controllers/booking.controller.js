import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import {
  reserveSeatsAndCreateBooking,
  releaseSeatsForBooking,
} from '../services/booking.service.js';

const POPULATE = [
  { path: 'movie', select: 'title poster duration language rating genre' },
  { path: 'cinema', select: 'name city address' },
  { path: 'screen', select: 'name screenNumber screenType' },
  { path: 'show', select: 'date startTime endTime ticketPrice status' },
];

export const createBooking = asyncHandler(async (req, res) => {
  const { showId, seats } = req.body;

  const booking = await reserveSeatsAndCreateBooking({
    userId: req.user._id,
    showId,
    seatNumbers: seats,
  });

  await booking.populate(POPULATE);

  return created(res, { booking }, 'Seats reserved — complete payment to confirm');
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(POPULATE);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'ADMIN') throw ApiError.forbidden();

  return ok(res, { booking });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.bookingStatus = status;

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(POPULATE),
    Booking.countDocuments(filter),
  ]);

  return ok(res, {
    bookings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'ADMIN') throw ApiError.forbidden();

  if (booking.bookingStatus === 'cancelled') {
    throw ApiError.badRequest('Booking is already cancelled');
  }
  if (booking.paymentStatus === 'paid') {
    throw ApiError.badRequest(
      'Paid bookings cannot be cancelled via this endpoint — request a refund instead'
    );
  }

  booking.bookingStatus = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  await releaseSeatsForBooking(booking._id);

  return ok(res, { booking }, 'Booking cancelled');
});

export const retryInfo = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'ADMIN') throw ApiError.forbidden();

  const now = new Date();
  const canRetry =
    booking.bookingStatus === 'pending' &&
    booking.paymentStatus === 'pending' &&
    booking.reservationExpiresAt > now;

  return ok(res, {
    canRetry,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    reservationExpiresAt: booking.reservationExpiresAt,
    secondsRemaining: Math.max(
      0,
      Math.floor((booking.reservationExpiresAt - now) / 1000)
    ),
  });
});