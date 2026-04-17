'use strict';

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '008-bc-';
let adminId;
let superId;

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  for (const email of [`${prefix}admin@t.test`, `${prefix}super@t.test`]) {
    await db('users').where({ email }).delete();
  }
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [a] = await db('users')
    .insert({ email: `${prefix}admin@t.test`, password_hash: hash, name: 'BC Admin', role: 'ADMIN' })
    .returning('id');
  adminId = a.id;
  const [s] = await db('users')
    .insert({ email: `${prefix}super@t.test`, password_hash: hash, name: 'BC Super', role: 'SUPER_ADMIN' })
    .returning('id');
  superId = s.id;
});

afterAll(async () => {
  await db('users').whereIn('id', [adminId, superId]).delete();
  await db.destroy();
});

describeIntegration('Business config masking (008)', () => {
  it('ADMIN ve tokens MP enmascarados', async () => {
    const res = await request(app)
      .get('/api/v1/business-config')
      .set('Authorization', `Bearer ${token(adminId)}`);
    expect(res.status).toBe(200);
    const row = res.body.data;
    if (row?.mp_access_token) expect(row.mp_access_token).toBe('***');
  });

  it('PUT business-config requiere Idempotency-Key', async () => {
    const res = await request(app)
      .put('/api/v1/business-config')
      .set('Authorization', `Bearer ${token(superId)}`)
      .send({ hotel_name: `Hotel ${randomUUID().slice(0, 6)}` });
    expect(res.status).toBe(400);
  });

  it('PUT business-config con Idempotency-Key → 200', async () => {
    const res = await request(app)
      .put('/api/v1/business-config')
      .set('Authorization', `Bearer ${token(superId)}`)
      .set('Idempotency-Key', randomUUID())
      .send({ hotel_name: `Hotel ${randomUUID().slice(0, 6)}` });
    expect(res.status).toBe(200);
  });
});
