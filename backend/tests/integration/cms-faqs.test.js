'use strict';

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '008-faq-';
let adminId;

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  const email = `${prefix}admin@hotel.test`;
  await db('users').where({ email }).delete();
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [a] = await db('users')
    .insert({ email, password_hash: hash, name: 'FAQ Admin', role: 'ADMIN' })
    .returning('id');
  adminId = a.id;
});

afterAll(async () => {
  await db('faqs').where('question', 'like', `${prefix}%`).delete();
  await db('users').where({ id: adminId }).delete();
  await db.destroy();
});

describeIntegration('CMS FAQs reorder (008)', () => {
  it('PUT /faqs/reorder persiste orden', async () => {
    const [a] = await db('faqs')
      .insert({ question: `${prefix} A`, answer: 'a', sort_order: 0, is_active: true })
      .returning('id');
    const [b] = await db('faqs')
      .insert({ question: `${prefix} B`, answer: 'b', sort_order: 1, is_active: true })
      .returning('id');

    const reorder = await request(app)
      .put('/api/v1/faqs/reorder')
      .set('Authorization', `Bearer ${token(adminId)}`)
      .send({ ids: [b.id, a.id] });
    expect(reorder.status).toBe(200);

    const pub = await request(app).get('/api/v1/faqs');
    expect(pub.status).toBe(200);
    const qs = pub.body.data.map((f) => f.id);
    expect(qs.indexOf(b.id)).toBeLessThan(qs.indexOf(a.id));

    await db('faqs').whereIn('id', [a.id, b.id]).delete();
  });
});
