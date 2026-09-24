import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';

const seedUsers = async () => {
  const adminReg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Admin', email: 'admin@test.com', password: 'secret123' });

  const adminId = adminReg.body.data.user.id;
  await User.updateOne({ _id: adminId }, { $set: { role: 'ADMIN' } });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'secret123' });

  const userReg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User', email: 'user@test.com', password: 'secret123' });

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
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('rejects a normal user on admin routes with 403', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokens.userToken}`);
    expect(res.status).toBe(403);
  });

  it('allows an ADMIN on admin routes with 200', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokens.adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeTypeOf('object');
  });

  it('prevents a USER from creating a movie with 403', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${tokens.userToken}`)
      .send({
        title: 'X',
        description: 'Y',
        poster: 'https://x/y.jpg',
        language: 'EN',
        duration: 90,
        releaseDate: '2030-01-01',
      });
    expect(res.status).toBe(403);
  });
});