import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { Cinema } from '../models/Cinema.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { Show } from '../models/Show.js';

const movieSnapshot = {
  tmdbId: 550,
  title: 'Race',
  poster: 'https://x/p.jpg',
  backdrop: 'https://x/b.jpg',
  duration: 100,
  language: 'EN',
  rating: 7,
  genre: ['Action'],
};

const setupTwoUsersAndShow = async () => {
  const u1 = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'U1',
      email: 'u1@test.com',
      password: 'secret123',
    });

  const u2 = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'U2',
      email: 'u2@test.com',
      password: 'secret123',
    });

  const cinema = await Cinema.create({
    name: 'Race Cinema',
    address: 'Race St',
    city: 'X',
  });

  const screen = await Screen.create({
    cinema: cinema._id,
    name: 'S1',
    screenNumber: 1,
    capacity: 5,
    rows: 1,
    columns: 5,
    screenType: 'STANDARD',
  });

  await Seat.create({
    screen: screen._id,
    seatNumber: 'A1',
    row: 'A',
    column: 1,
    seatType: 'REGULAR',
    priceMultiplier: 1,
  });

  const t = new Date(Date.now() + 3600_000);

  const show = await Show.create({
    movie: movieSnapshot,
    cinema: cinema._id,
    screen: screen._id,
    date: t,
    startTime: t,
    endTime: new Date(
      t.getTime() + 3600_000
    ),
    ticketPrice: 10,
    totalSeats: 5,
  });

  return {
    token1: u1.body.data.accessToken,
    token2: u2.body.data.accessToken,
    showId: show._id.toString(),
  };
};

describe('Double booking prevention', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await setupTwoUsersAndShow();
  });

  it('allows only one of two concurrent requests for the same seat', async () => {
    const fire = (token) =>
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          showId: ctx.showId,
          seats: ['A1'],
        });

    const [r1, r2] = await Promise.all([
      fire(ctx.token1),
      fire(ctx.token2),
    ]);

    const statuses = [r1.status, r2.status].sort();

    expect(statuses).toEqual([201, 409]);

    const show = await Show.findById(
      ctx.showId
    ).lean();

    const reservedA1 = show.occupiedSeats.filter(
      (s) => s.seatNumber === 'A1'
    );

    expect(reservedA1.length).toBe(1);
  });

  it('rejects a second booking for an already reserved seat with 409', async () => {
    const t = new Date(
      Date.now() + 3600_000
    );

    const extraShow = await Show.create({
      movie: movieSnapshot,
      cinema: (
        await Cinema.findOne({
          name: 'Race Cinema',
        })
      )._id,
      screen: (
        await Screen.findOne({
          name: 'S1',
        })
      )._id,
      date: t,
      startTime: new Date(
        t.getTime() + 5 * 3600_000
      ),
      endTime: new Date(
        t.getTime() + 6 * 3600_000
      ),
      ticketPrice: 10,
      totalSeats: 5,
    });

    const first = await request(app)
      .post('/api/bookings')
      .set(
        'Authorization',
        `Bearer ${ctx.token1}`
      )
      .send({
        showId: extraShow._id.toString(),
        seats: ['A1'],
      });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/bookings')
      .set(
        'Authorization',
        `Bearer ${ctx.token2}`
      )
      .send({
        showId: extraShow._id.toString(),
        seats: ['A1'],
      });

    expect(second.status).toBe(409);
  });
});