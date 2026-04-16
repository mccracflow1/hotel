'use strict';

/**
 * T034 — ADMIN no puede asignar SUPER_ADMIN al crear usuario.
 */

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '004-users-';
let adminId;

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  const email = `${prefix}admin@hotel.test`;
  await db('users').where({ email }).delete();
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [row] = await db('users')
    .insert({ email, password_hash: hash, name: 'Users RBAC Admin', role: 'ADMIN' })
    .returning('id');
  adminId = row.id;
});

afterAll(async () => {
  await db('users').where('email', 'like', `${prefix}%`).delete();
  await db.destroy();
});

describeIntegration('Users RBAC (004)', () => {
  it('ADMIN no puede crear usuario SUPER_ADMIN → 403', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token(adminId)}`)
      .send({
        email: `${prefix}super@hotel.test`,
        password: 'TestPass1!',
        name: 'Should Fail',
        role: 'SUPER_ADMIN',
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
