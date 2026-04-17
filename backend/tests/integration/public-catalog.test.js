'use strict';

require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

describeIntegration('Public catalog (008)', () => {
  it('GET /public/rooms → 200', async () => {
    const res = await request(app).get('/api/v1/public/rooms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /public/plans → 200', async () => {
    const res = await request(app).get('/api/v1/public/plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
