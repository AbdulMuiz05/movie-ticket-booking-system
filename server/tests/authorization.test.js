import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';

const seedUsers = async () => {
  const adminReg = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'secret123',
    });

  const adminId = adminReg.body.data.user.id;

  await User.updateOne(
    { _id: adminId },
    { $set: { role: 'ADMIN' } }
  );

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@test.com',
      password: 'secret123',
    });

  const userReg = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User',
      email: 'user@test.com',
      password: 'secret123',
    });

  return {
    adminToken: adminLogin.body.data.accessToken,
    userToken: userReg.body.data.accessToken,
  };
};

describe('Authorization', () => {
  let tokens;

  beforeAll(async () => {
    tokens = await seedUsers();
  });

  it('rejects unauthenticated admin access with 401', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard');

    expect(res.status).toBe(401);
  });

  it('rejects a normal user on admin routes with 403', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(
        'Authorization',
        `Bearer ${tokens.userToken}`
      );

    expect(res.status).toBe(403);
  });

  it('allows an ADMIN on admin routes with 200', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(
        'Authorization',
        `Bearer ${tokens.adminToken}`
      );

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeTypeOf('object');
  });

  it('prevents a USER from creating a show with 403', async () => {
    const res = await request(app)
      .post('/api/shows')
      .set(
        'Authorization',
        `Bearer ${tokens.userToken}`
      )
      .send({
        tmdbMovieId: 550,
        cinema: '000000000000000000000000',
        screen: '000000000000000000000000',
        date: '2030-01-01T10:00:00.000Z',
        startTime: '2030-01-01T10:00:00.000Z',
        endTime: '2030-01-01T12:00:00.000Z',
        ticketPrice: 10,
        totalSeats: 20,
      });

    expect(res.status).toBe(403);
  });
});