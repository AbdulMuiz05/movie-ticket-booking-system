import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Cinema } from '../models/Cinema.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { Show } from '../models/Show.js';

let userToken;
let showId;

const seedFixtures = async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Booker', email: 'booker@test.com', password: 'secret123' });
  userToken = reg.body.data.accessToken;

  const movie = await Movie.create({
    title: 'Fixture Movie',
    description: 'Fixture',
    poster: 'https://x/p.jpg',
    language: 'EN',
    genre: ['Action'],
    duration: 120,
    releaseDate: new Date(),
    status: 'NOW_SHOWING',
  });

  const cinema = await Cinema.create({
    name: 'Fixture Cinema',
    address: 'Fixture St',
    city: 'Test',
  });

  const screen = await Screen.create({
    cinema: cinema._id,
    name: 'Screen 1',
    screenNumber: 1,
    capacity: 20,
    rows: 2,
    columns: 10,
    screenType: 'STANDARD',
  });

  const seats = [];
  for (const row of ['A', 'B']) {
    for (let c = 1; c <= 10; c++) {
      seats.push({
        screen: screen._id,
        seatNumber: `${row}${c}`,
        row,
        column: c,
        seatType: 'REGULAR',
        priceMultiplier: 1,
      });
    }
  }
  await Seat.insertMany(seats);

  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const show = await Show.create({
    movie: movie._id,
    cinema: cinema._id,
    screen: screen._id,
    date: startTime,
    startTime,
    endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
    ticketPrice: 10,
    totalSeats: 20,
    status: 'SCHEDULED',
  });
  showId = show._id.toString();
};

describe('Booking', () => {
  beforeAll(async () => {
    await seedFixtures();
  });

  it('creates a pending booking and reserves the seats', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats: ['A1', 'A2'] });

    expect(res.status).toBe(201);
    const { booking } = res.body.data;
    expect(booking.bookingStatus).toBe('pending');
    expect(booking.paymentStatus).toBe('pending');
    expect(booking.quantity).toBe(2);
    expect(booking.totalAmount).toBe(20);
    expect(booking.seats.sort()).toEqual(['A1', 'A2']);

    const show = await Show.findById(showId).lean();
    const reserved = show.occupiedSeats
      .filter((s) => s.status === 'reserved')
      .map((s) => s.seatNumber)
      .sort();
    expect(reserved).toEqual(['A1', 'A2']);
  });

  it('rejects duplicate seats in a request with 422', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats: ['B1', 'B1'] });
    expect([400, 422]).toContain(res.status);
  });

  it('rejects unknown seats with 400', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats: ['Z9'] });
    expect(res.status).toBe(400);
  });

  it('rejects more than 5 seats with 422', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8'] });
    expect(res.status).toBe(422);
  });

  it('marks the booking expired and releases seats after the reservation window', async () => {
    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats: ['B5'] });

    expect(create.status).toBe(201);
    const bookingId = create.body.data.booking._id;

    // Force expiry
    const { Booking } = await import('../models/Booking.js');
    await Booking.updateOne(
      { _id: bookingId },
      { $set: { reservationExpiresAt: new Date(Date.now() - 60_000) } }
    );
    await Show.updateOne(
      { _id: showId, 'occupiedSeats.booking': bookingId },
      { $set: { 'occupiedSeats.$[e].expiresAt': new Date(Date.now() - 60_000) } },
      { arrayFilters: [{ 'e.booking': bookingId }] }
    );

    const { releaseExpiredReservations } = await import('../services/booking.service.js');
    await releaseExpiredReservations();

    const updatedBooking = await Booking.findById(bookingId).lean();
    expect(updatedBooking.bookingStatus).toBe('expired');

    const show = await Show.findById(showId).lean();
    const stillHeld = show.occupiedSeats.some(
      (s) => s.booking.toString() === bookingId.toString()
    );
    expect(stillHeld).toBe(false);
  });
});