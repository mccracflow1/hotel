'use strict';

/**
 * T036 — SC-007: mismos query params → mismos totales el mismo día.
 */

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '004-rep-';
let userId;

function token(uid) {
  return jwt.sign({ sub: uid }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  const email = `${prefix}viewer@hotel.test`;
  await db('users').where({ email }).delete();
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [row] = await db('users')
    .insert({ email, password_hash: hash, name: 'Rep Test', role: 'VIEWER' })
    .returning('id');
  userId = row.id;
});

afterAll(async () => {
  await db('users').where('email', 'like', `${prefix}%`).delete();
  await db.destroy();
});

describeIntegration('Reports reproducibility (004)', () => {
  const q = { from: '2026-01-01', to: '2026-12-31', granularity: 'day' };

  it('dos GET /reports/occupancy con mismos params → mismo cuerpo', async () => {
    const auth = `Bearer ${token(userId)}`;
    const a = await request(app).get('/api/v1/reports/occupancy').query(q).set('Authorization', auth);
    const b = await request(app).get('/api/v1/reports/occupancy').query(q).set('Authorization', auth);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(JSON.stringify(a.body)).toBe(JSON.stringify(b.body));
  });

  it('dos GET /reports/revenue con mismos params → mismo cuerpo', async () => {
    const auth = `Bearer ${token(userId)}`;
    const a = await request(app).get('/api/v1/reports/revenue').query(q).set('Authorization', auth);
    const b = await request(app).get('/api/v1/reports/revenue').query(q).set('Authorization', auth);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(JSON.stringify(a.body)).toBe(JSON.stringify(b.body));
  });
});
