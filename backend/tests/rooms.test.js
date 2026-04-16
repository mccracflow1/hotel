'use strict';

/**
 * Rooms integration tests — requiere DB migrada y JWT_SECRET.
 */
require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const db = require('../src/config/database');

const admin = {
  email: 'rooms-admin@hotel.test',
  password: 'TestPass1!',
  name: 'Rooms Admin',
  role: 'ADMIN',
};

const viewer = {
  email: 'rooms-viewer@hotel.test',
  password: 'TestPass1!',
  name: 'Rooms Viewer',
  role: 'VIEWER',
};

let adminId;
let viewerId;
let adminToken;

beforeAll(async () => {
  await db('users').whereIn('email', [admin.email, viewer.email]).delete();
  const h = await bcrypt.hash(admin.password, 12);
  const [a] = await db('users')
    .insert({ email: admin.email, password_hash: h, name: admin.name, role: admin.role })
    .returning('*');
  adminId = a.id;
  const [v] = await db('users')
    .insert({
      email: viewer.email,
      password_hash: h,
      name: viewer.name,
      role: viewer.role,
    })
    .returning('*');
  viewerId = v.id;

  const login = await request(app).post('/api/v1/auth/login').send({
    email: admin.email,
    password: admin.password,
  });
  adminToken = login.body.accessToken;
});

afterAll(async () => {
  await db('users').whereIn('id', [adminId, viewerId]).delete();
  await db.destroy();
});

describe('GET /api/v1/rooms', () => {
  it('responde 200 sin auth', async () => {
    const res = await request(app).get('/api/v1/rooms');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/v1/rooms', () => {
  it('VIEWER recibe 403', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      email: viewer.email,
      password: viewer.password,
    });
    const token = login.body.accessToken;
    const res = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Room',
        type: 'room',
        capacity: 2,
        base_price: 100,
      });
    expect(res.status).toBe(403);
  });

  it('ADMIN crea habitación 201', async () => {
    const res = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Integration Room ${Date.now()}`,
        type: 'room',
        capacity: 2,
        base_price: 150.5,
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.slug).toBeDefined();
    await db('rooms').where({ id: res.body.data.id }).delete();
  });
});
