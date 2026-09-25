import crypto from 'crypto';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Show } from '../models/Show.js';
import { Seat } from '../models/Seat.js';
import { ApiError } from '../utils/ApiError.js';

const RESERVATION_MINUTES = Number(
  process.env.SEAT_RESERVATION_MINUTES || 10
);

const generateBookingReference = () =>
  `BK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

export const reserveSeatsAndCreateBooking = async ({
  userId,
  showId,
  seatNumbers,
}) => {
  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      const show = await Show.findById(showId).session(session);

      if (!show) {
        throw ApiError.notFound('Show not found');
      }

      if (show.status !== 'SCHEDULED') {
        throw ApiError.badRequest('Show is not available for booking');
      }

      const seats = [...new Set(seatNumbers || [])];

if (!seats.length) {
  throw ApiError.badRequest('At least one seat is required');
}

const existingSeats = await Seat.find({
  screen: show.screen,
  seatNumber: { $in: seats },
})
  .select('seatNumber')
  .session(session)
  .lean();

const existingSeatNumbers = new Set(
  existingSeats.map((seat) => seat.seatNumber)
);

const invalidSeats = seats.filter(
  (seat) => !existingSeatNumbers.has(seat)
);

if (invalidSeats.length) {
  throw ApiError.badRequest(
    `Invalid seat(s): ${invalidSeats.join(', ')}`
  );
}

      const now = new Date();

      show.occupiedSeats = (show.occupiedSeats || []).filter(
        (seat) =>
          seat.status === 'booked' ||
          (seat.status === 'reserved' &&
            seat.expiresAt &&
            seat.expiresAt > now)
      );

      const occupied = new Set(
        show.occupiedSeats.map((seat) => seat.seatNumber)
      );

      const alreadyOccupied = seats.filter((seat) =>
        occupied.has(seat)
      );

      if (alreadyOccupied.length) {
        throw ApiError.conflict(
          `Seats already occupied: ${alreadyOccupied.join(', ')}`
        );
      }

      if (seats.length > show.availableSeats) {
        throw ApiError.badRequest('Not enough seats available');
      }

      const reservationExpiresAt = new Date(
        Date.now() + RESERVATION_MINUTES * 60 * 1000
      );

      const totalAmount = seats.length * show.ticketPrice;

      const createdBookings = await Booking.create(
        [
          {
            user: userId,
            show: show._id,
            movie: show.movie,
            cinema: show.cinema,
            screen: show.screen,
            seats,
            quantity: seats.length,
            totalAmount,
            bookingStatus: 'pending',
            paymentStatus: 'pending',
            bookingReference: generateBookingReference(),
            reservationExpiresAt,
          },
        ],
        { session }
      );

      booking = createdBookings[0];

      show.occupiedSeats.push(
        ...seats.map((seatNumber) => ({
          seatNumber,
          booking: booking._id,
          user: userId,
          status: 'reserved',
          expiresAt: reservationExpiresAt,
        }))
      );

      await show.save({ session });
    });

    return booking;
  } finally {
    await session.endSession();
  }
};

export const releaseSeatsForBooking = async (bookingId) => {
  await Show.updateOne(
    { 'occupiedSeats.booking': bookingId },
    {
      $pull: {
        occupiedSeats: {
          booking: bookingId,
        },
      },
    }
  );
};

export const releaseExpiredReservations = async () => {
  const now = new Date();

  const shows = await Show.find({
    'occupiedSeats': {
      $elemMatch: {
        status: 'reserved',
        expiresAt: { $lte: now },
      },
    },
  });

  let showsTouched = 0;
  let bookingsExpired = 0;

  for (const show of shows) {
    const expiredBookings = [
      ...new Set(
        show.occupiedSeats
          .filter(
            (seat) =>
              seat.status === 'reserved' &&
              seat.expiresAt &&
              seat.expiresAt <= now
          )
          .map((seat) => seat.booking?.toString())
          .filter(Boolean)
      ),
    ];

    show.occupiedSeats = show.occupiedSeats.filter(
      (seat) =>
        seat.status === 'booked' ||
        (seat.status === 'reserved' &&
          seat.expiresAt &&
          seat.expiresAt > now)
    );

    await show.save();

    showsTouched += 1;

    if (expiredBookings.length) {
      const result = await Booking.updateMany(
        {
          _id: { $in: expiredBookings },
          bookingStatus: 'pending',
          paymentStatus: 'pending',
        },
        {
          $set: {
            bookingStatus: 'expired',
            paymentStatus: 'failed',
          },
        }
      );

      bookingsExpired += result.modifiedCount || 0;
    }
  }

  return {
    showsTouched,
    bookingsExpired,
  };
};

export const getReservationMinutes = () => RESERVATION_MINUTES;