'use strict';

/**
 * T032 — list/detail/policy/RBAC + AGENT en lecturas permitidas.
 * Requiere DATABASE_URL y migraciones aplicadas.
 */

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '004-rbac-';
const users = {};

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  for (const role of ['VIEWER', 'AGENT', 'ADMIN']) {
    const email = `${prefix}${role.toLowerCase()}@hotel.test`;
    await db('users').where({ email }).delete();
    const hash = await bcrypt.hash('TestPass1!', 12);
    const [row] = await db('users')
      .insert({ email, password_hash: hash, name: role, role })
      .returning('id');
    users[role] = row.id;
  }
});

afterAll(async () => {
  await db('users').where('email', 'like', `${prefix}%`).delete();
  await db.destroy();
});

describeIntegration('Reservations RBAC + AGENT reads (004)', () => {
  it('VIEWER lista reservas → 200', async () => {
    const res = await request(app)
      .get('/api/v1/reservations')
      .set('Authorization', `Bearer ${token(users.VIEWER)}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('AGENT lista reservas → 200', async () => {
    const res = await request(app)
      .get('/api/v1/reservations')
      .set('Authorization', `Bearer ${token(users.AGENT)}`);
    expect(res.status).toBe(200);
  });

  it('VIEWER no puede PATCH estado → 403', async () => {
    const res = await request(app)
      .patch(`/api/v1/reservations/${randomUUID()}/status`)
      .set('Authorization', `Bearer ${token(users.VIEWER)}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(403);
  });

  it('AGENT puede GET policy (404 si no existe id)', async () => {
    const res = await request(app)
      .get(`/api/v1/reservations/${randomUUID()}/policy`)
      .set('Authorization', `Bearer ${token(users.AGENT)}`);
    expect([404]).toContain(res.status);
  });
});
