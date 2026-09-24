import mongoose from 'mongoose';
import { Show } from '../models/Show.js';
import { Seat } from '../models/Seat.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { makeBookingReference } from '../utils/bookingRef.js';
import { MAX_SEATS_PER_BOOKING } from '../validators/booking.validators.js';

const RESERVATION_MINUTES = Number(process.env.SEAT_RESERVATION_MINUTES) || 10;
const RESERVATION_MS = RESERVATION_MINUTES * 60 * 1000;

export const getReservationMinutes = () => RESERVATION_MINUTES;

/**
 * Atomically reserve the requested seats on the given show and create a
 * pending Booking. Uses a single findOneAndUpdate with $nor/$elemMatch so
 * two concurrent requests cannot both succeed for the same seat.
 */
export const reserveSeatsAndCreateBooking = async ({ userId, showId, seatNumbers }) => {
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    throw ApiError.badRequest('At least one seat is required');
  }
  if (seatNumbers.length > MAX_SEATS_PER_BOOKING) {
    throw ApiError.badRequest(`You can select at most ${MAX_SEATS_PER_BOOKING} seats`);
  }
  if (new Set(seatNumbers).size !== seatNumbers.length) {
    throw ApiError.badRequest('Duplicate seats in request');
  }

  const show = await Show.findById(showId)
    .populate('movie')
    .populate('cinema')
    .populate('screen');
  if (!show) throw ApiError.notFound('Show not found');
  if (show.status !== 'SCHEDULED') throw ApiError.conflict('Show is not bookable');
  if (show.endTime <= new Date()) throw ApiError.conflict('Show has already ended');

  // Verify the requested seat numbers exist on this screen and are active.
  const seats = await Seat.find({
    screen: show.screen._id,
    seatNumber: { $in: seatNumbers },
  });
  if (seats.length !== seatNumbers.length) {
    const found = new Set(seats.map((s) => s.seatNumber));
    const missing = seatNumbers.filter((s) => !found.has(s));
    throw ApiError.badRequest(`Unknown seats on this screen: ${missing.join(', ')}`);
  }
  const inactive = seats.filter((s) => s.status !== 'ACTIVE').map((s) => s.seatNumber);
  if (inactive.length) {
    throw ApiError.conflict(`Seats not available: ${inactive.join(', ')}`);
  }

  // If this user already holds a live reservation on this show that overlaps,
  // return the existing booking id so the frontend can send them to checkout.
  const existing = await Booking.findOne({
    user: userId,
    show: show._id,
    bookingStatus: 'pending',
    paymentStatus: 'pending',
    reservationExpiresAt: { $gt: new Date() },
    seats: { $in: seatNumbers },
  });
  if (existing) {
    throw new ApiError(
      409,
      'You already have an active reservation for some of these seats',
      { existingBookingId: existing._id.toString() }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_MS);
  const bookingId = new mongoose.Types.ObjectId();

  const occupiedEntries = seatNumbers.map((seatNumber) => ({
    seatNumber,
    booking: bookingId,
    user: userId,
    status: 'reserved',
    expiresAt,
  }));

  // ── Atomic reservation ─────────────────────────────────────────────────
  const updatedShow = await Show.findOneAndUpdate(
    {
      _id: show._id,
      status: 'SCHEDULED',
      endTime: { $gt: now },
      $nor: [
        {
          occupiedSeats: {
            $elemMatch: {
              seatNumber: { $in: seatNumbers },
              $or: [
                { status: 'booked' },
                { status: 'reserved', expiresAt: { $gt: now } },
              ],
            },
          },
        },
      ],
    },
    { $push: { occupiedSeats: { $each: occupiedEntries } } },
    { new: true }
  );

  if (!updatedShow) {
    throw ApiError.conflict('One or more selected seats are no longer available');
  }
  // ───────────────────────────────────────────────────────────────────────

  // Price = base ticket price × per-seat multiplier.
  const seatDoc = new Map(seats.map((s) => [s.seatNumber, s]));
  const totalAmount = seatNumbers.reduce((sum, sn) => {
    const s = seatDoc.get(sn);
    return sum + show.ticketPrice * (s?.priceMultiplier || 1);
  }, 0);

  let booking;
  try {
    booking = await Booking.create({
      _id: bookingId,
      user: userId,
      show: show._id,
      movie: show.movie._id,
      cinema: show.cinema._id,
      screen: show.screen._id,
      seats: seatNumbers,
      quantity: seatNumbers.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      bookingReference: makeBookingReference(),
      reservationExpiresAt: expiresAt,
    });
  } catch (err) {
    // Roll back the seat reservation so the Show is not left with orphans.
    await Show.updateOne(
      { _id: show._id },
      { $pull: { occupiedSeats: { booking: bookingId } } }
    );
    throw err;
  }

  return booking;
};

export const releaseSeatsForBooking = async (bookingId) => {
  await Show.updateOne(
    { 'occupiedSeats.booking': bookingId },
    { $pull: { occupiedSeats: { booking: bookingId } } }
  );
};

/**
 * Releases all expired reservations (status: 'reserved', expiresAt <= now)
 * and marks the owning bookings as 'expired'. Returns counts for logging.
 * Also called by the cron job in Chunk 6.
 */
export const releaseExpiredReservations = async () => {
  const now = new Date();

  // Find candidate show ids first to avoid pulling from every show.
  const showIds = await Show.distinct('_id', {
    'occupiedSeats.status': 'reserved',
    'occupiedSeats.expiresAt': { $lte: now },
  });

  if (!showIds.length) return { showsTouched: 0, bookingsExpired: 0 };

  // Collect the booking ids that will be released.
  const shows = await Show.find(
    { _id: { $in: showIds } },
    { occupiedSeats: 1 }
  ).lean();

  const expiredBookingIds = new Set();
  for (const s of shows) {
    for (const os of s.occupiedSeats || []) {
      if (os.status === 'reserved' && os.expiresAt && os.expiresAt.getTime() <= now.getTime()) {
        expiredBookingIds.add(os.booking.toString());
      }
    }
  }

  // Pull the expired entries.
  const res = await Show.updateMany(
    { _id: { $in: showIds } },
    { $pull: { occupiedSeats: { status: 'reserved', expiresAt: { $lte: now } } } }
  );

  let bookingsExpired = 0;
  if (expiredBookingIds.size) {
    const upd = await Booking.updateMany(
      {
        _id: { $in: [...expiredBookingIds] },
        bookingStatus: 'pending',
        paymentStatus: 'pending',
      },
      { $set: { bookingStatus: 'expired' } }
    );
    bookingsExpired = upd.modifiedCount || 0;
  }

  return { showsTouched: res.modifiedCount || 0, bookingsExpired };
};