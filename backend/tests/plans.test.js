'use strict';

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const db = require('../src/config/database');

const admin = {
  email: 'plans-admin@hotel.test',
  password: 'TestPass1!',
  name: 'Plans Admin',
  role: 'ADMIN',
};

let adminId;
let adminToken;

beforeAll(async () => {
  await db('users').where({ email: admin.email }).delete();
  const h = await bcrypt.hash(admin.password, 12);
  const [a] = await db('users')
    .insert({ email: admin.email, password_hash: h, name: admin.name, role: admin.role })
    .returning('*');
  adminId = a.id;
  const login = await request(app).post('/api/v1/auth/login').send({
    email: admin.email,
    password: admin.password,
  });
  adminToken = login.body.accessToken;
});

afterAll(async () => {
  await db('users').where({ id: adminId }).delete();
  await db.destroy();
});

describe('Plans API', () => {
  it('GET /api/v1/plans público 200', async () => {
    const res = await request(app).get('/api/v1/plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/optional-activities lista', async () => {
    const res = await request(app).get('/api/v1/optional-activities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
