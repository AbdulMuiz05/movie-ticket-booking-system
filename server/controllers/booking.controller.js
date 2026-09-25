import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import {
  reserveSeatsAndCreateBooking,
  releaseSeatsForBooking,
} from '../services/booking.service.js';

const populateBooking = async (booking) => {
  await booking.populate([
    {
      path: 'cinema',
      select: 'name city address',
    },
    {
      path: 'screen',
      select: 'name screenNumber screenType',
    },
    {
      path: 'show',
      select: 'date startTime endTime ticketPrice status',
    },
  ]);

  return booking;
};

export const createBooking = asyncHandler(async (req, res) => {
  const { showId, seats } = req.body;

  const booking = await reserveSeatsAndCreateBooking({
    userId: req.user._id,
    showId,
    seatNumbers: seats,
  });

  await populateBooking(booking);

  return created(
    res,
    { booking },
    'Seats reserved — complete payment to confirm'
  );
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  const isOwner =
    booking.user.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  await populateBooking(booking);

  return ok(res, { booking });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const {
    status,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 20;

  const filter = {
    user: req.user._id,
  };

  if (status) {
    filter.bookingStatus = status;
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
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
        select: 'date startTime endTime ticketPrice status',
      }),
    Booking.countDocuments(filter),
  ]);

  return ok(res, {
    bookings,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber),
    },
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  const isOwner =
    booking.user.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  if (booking.bookingStatus === 'cancelled') {
    throw ApiError.badRequest('Booking is already cancelled');
  }

  if (booking.paymentStatus === 'paid') {
    throw ApiError.badRequest(
      'Paid bookings cannot be cancelled through this endpoint. Request a refund instead.'
    );
  }

  booking.bookingStatus = 'cancelled';
  booking.cancelledAt = new Date();

  await booking.save();

  await releaseSeatsForBooking(booking._id);

  await populateBooking(booking);

  return ok(
    res,
    { booking },
    'Booking cancelled'
  );
});

export const retryInfo = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  const isOwner =
    booking.user.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  const canRetry =
    booking.bookingStatus === 'pending' &&
    booking.paymentStatus === 'pending' &&
    booking.reservationExpiresAt &&
    booking.reservationExpiresAt > new Date();

  return ok(res, {
    canRetry,
    bookingId: booking._id,
    bookingReference: booking.bookingReference,
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
    reservationExpiresAt: booking.reservationExpiresAt,
  });
});