'use strict';

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const db = require('../src/config/database');

const agentUser = {
  email: 'res-agent@hotel.test',
  password: 'TestPass1!',
  name: 'Res Agent',
  role: 'AGENT',
};

const viewerUser = {
  email: 'res-viewer@hotel.test',
  password: 'TestPass1!',
  name: 'Res Viewer',
  role: 'VIEWER',
};

let agentId;
let viewerId;
let agentToken;

beforeAll(async () => {
  await db('users').whereIn('email', [agentUser.email, viewerUser.email]).delete();
  const h = await bcrypt.hash(agentUser.password, 12);
  const [a] = await db('users')
    .insert({
      email: agentUser.email,
      password_hash: h,
      name: agentUser.name,
      role: agentUser.role,
    })
    .returning('*');
  agentId = a.id;
  const [v] = await db('users')
    .insert({
      email: viewerUser.email,
      password_hash: h,
      name: viewerUser.name,
      role: viewerUser.role,
    })
    .returning('*');
  viewerId = v.id;

  const login = await request(app).post('/api/v1/auth/login').send({
    email: agentUser.email,
    password: agentUser.password,
  });
  agentToken = login.body.accessToken;
});

afterAll(async () => {
  await db('users').whereIn('id', [agentId, viewerId]).delete();
  await db.destroy();
});

describe('POST /api/v1/reservations', () => {
  it('VIEWER recibe 403', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      email: viewerUser.email,
      password: viewerUser.password,
    });
    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .set('Idempotency-Key', 'test-key-viewer')
      .send({
        room_id: '00000000-0000-0000-0000-000000000001',
        customer_name: 'X',
        customer_document: '1',
        customer_phone: '1',
        date_start: '2030-01-01',
        adults: 1,
      });
    expect(res.status).toBe(403);
  });

  it('sin Idempotency-Key → 400', async () => {
    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        room_id: '00000000-0000-0000-0000-000000000001',
        customer_name: 'X',
        customer_document: '1',
        customer_phone: '1',
        date_start: '2030-01-01',
        adults: 1,
      });
    expect(res.status).toBe(400);
  });
});
