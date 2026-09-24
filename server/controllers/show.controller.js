import mongoose from 'mongoose';
import { Show } from '../models/Show.js';
import { Movie } from '../models/Movie.js';
import { Cinema } from '../models/Cinema.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { sendShowAddedNotification } from '../services/email.service.js';

const dayRange = (dateInput) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) throw ApiError.badRequest('Invalid date');
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

export const listShows = asyncHandler(async (req, res) => {
  const { movieId, cinemaId, date, status, page = 1, limit = 200 } = req.query;

  const filter = {};

  if (status) {
    filter.status = status;
  } else {
    filter.status = { $ne: 'CANCELLED' };
    filter.endTime = { $gt: new Date() };
  }

  if (movieId) filter.movie = movieId;
  if (cinemaId) filter.cinema = cinemaId;
  if (date) {
    const { start, end } = dayRange(date);
    filter.date = { $gte: start, $lt: end };
  }

  const skip = (page - 1) * limit;
  const [shows, total] = await Promise.all([
    Show.find(filter)
      .populate('movie', 'title poster duration language rating genre')
      .populate('cinema', 'name city address')
      .populate('screen', 'name screenNumber screenType')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit),
    Show.countDocuments(filter),
  ]);

  return ok(res, {
    shows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('movie')
    .populate('cinema', 'name city address')
    .populate('screen', 'name screenNumber screenType rows columns');
  if (!show) throw ApiError.notFound('Show not found');
  return ok(res, { show });
});

export const createShow = asyncHandler(async (req, res) => {
  const { movie, cinema, screen, date, startTime, endTime, ticketPrice, status } = req.body;

  const [movieDoc, cinemaDoc, screenDoc] = await Promise.all([
    Movie.findById(movie),
    Cinema.findById(cinema),
    Screen.findById(screen),
  ]);

  if (!movieDoc) throw ApiError.notFound('Movie not found');
  if (!cinemaDoc) throw ApiError.notFound('Cinema not found');
  if (!screenDoc) throw ApiError.notFound('Screen not found');
  if (screenDoc.cinema.toString() !== cinemaDoc._id.toString()) {
    throw ApiError.badRequest('Screen does not belong to the specified cinema');
  }
  if (!screenDoc.active) throw ApiError.badRequest('Screen is inactive');

  const seatCount = await Seat.countDocuments({ screen: screenDoc._id, status: 'ACTIVE' });
  if (seatCount === 0) throw ApiError.badRequest('Screen has no active seats');

  const computedEnd = endTime
    ? new Date(endTime)
    : new Date(new Date(startTime).getTime() + (movieDoc.duration || 120) * 60 * 1000);

  // Screen double-booking: a screen cannot have two overlapping shows.
  const overlap = await Show.findOne({
    screen: screenDoc._id,
    status: { $ne: 'CANCELLED' },
    $or: [
      { startTime: { $lt: computedEnd }, endTime: { $gt: new Date(startTime) } },
    ],
  });
  if (overlap) {
    throw ApiError.conflict('Screen already booked for an overlapping time');
  }

  const show = await Show.create({
    movie: movieDoc._id,
    cinema: cinemaDoc._id,
    screen: screenDoc._id,
    date: new Date(date),
    startTime: new Date(startTime),
    endTime: computedEnd,
    ticketPrice,
    totalSeats: seatCount,
    status: status || 'SCHEDULED',
  });

  const notificationShow = await Show.findById(show._id)
    .populate('movie', 'title')
    .populate('cinema', 'name');
  sendShowAddedNotification(notificationShow).catch((err) =>
    console.error('[email] new show notification failed:', err.message)
  );

  return created(res, { show }, 'Show created');
});

export const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) throw ApiError.notFound('Show not found');

  const { date, startTime, endTime, ticketPrice, status } = req.body;

  if (startTime || endTime) {
    const newStart = startTime ? new Date(startTime) : show.startTime;
    const newEnd = endTime
      ? new Date(endTime)
      : new Date(newStart.getTime() + (show.endTime - show.startTime));

    const overlap = await Show.findOne({
      _id: { $ne: show._id },
      screen: show.screen,
      status: { $ne: 'CANCELLED' },
      startTime: { $lt: newEnd },
      endTime: { $gt: newStart },
    });
    if (overlap) throw ApiError.conflict('Screen already booked for an overlapping time');

    show.startTime = newStart;
    show.endTime = newEnd;
  }

  if (date !== undefined) show.date = new Date(date);
  if (ticketPrice !== undefined) show.ticketPrice = ticketPrice;
  if (status !== undefined) show.status = status;

  await show.save();
  return ok(res, { show }, 'Show updated');
});

export const cancelShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) throw ApiError.notFound('Show not found');
  if (show.status === 'CANCELLED') throw ApiError.badRequest('Show already cancelled');

  show.status = 'CANCELLED';
  await show.save();

  // (Bookings for this show will be handled by refund flow in a later chunk.)
  return ok(res, null, 'Show cancelled');
});

export const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) throw ApiError.notFound('Show not found');

  if (show.occupiedSeats?.some((s) => s.status === 'booked')) {
    throw ApiError.conflict('Cannot delete: show has confirmed bookings. Cancel instead.');
  }

  await Show.findByIdAndDelete(show._id);
  return ok(res, null, 'Show deleted');
});

// Available dates for a given movie ---------------------------------------

export const availableDatesForMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  if (!mongoose.isValidObjectId(movieId)) throw ApiError.badRequest('Invalid movie id');

  const now = new Date();
  const shows = await Show.find({
    movie: movieId,
    status: 'SCHEDULED',
    endTime: { $gt: now },
  }).select('date');

  const dates = [...new Set(shows.map((s) => s.date.toISOString().slice(0, 10)))].sort();
  return ok(res, { dates });
});

// Occupied seats for a show -----------------------------------------------

export const occupiedSeatsForShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).select('occupiedSeats totalSeats');
  if (!show) throw ApiError.notFound('Show not found');

  const now = Date.now();
  const active = show.occupiedSeats.filter(
    (s) => s.status === 'booked' || (s.status === 'reserved' && s.expiresAt.getTime() > now)
  );

  return ok(res, {
    totalSeats: show.totalSeats,
    occupied: active.map((s) => ({ seatNumber: s.seatNumber, status: s.status })),
    availableCount: show.totalSeats - active.length,
  });
});