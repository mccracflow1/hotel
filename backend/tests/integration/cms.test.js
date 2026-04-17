'use strict';

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '005-cms-';
let adminId;
let viewerId;

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  const adminEmail = `${prefix}admin@hotel.test`;
  const viewerEmail = `${prefix}viewer@hotel.test`;
  await db('users').whereIn('email', [adminEmail, viewerEmail]).delete();
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [a] = await db('users')
    .insert({ email: adminEmail, password_hash: hash, name: 'CMS Admin', role: 'ADMIN' })
    .returning('id');
  adminId = a.id;
  const [v] = await db('users')
    .insert({ email: viewerEmail, password_hash: hash, name: 'CMS Viewer', role: 'VIEWER' })
    .returning('id');
  viewerId = v.id;

  await db('site_content').where({ section: 'hero', key: 'title' }).delete();
  await db('faqs').where('question', 'like', `${prefix}%`).delete();
});

afterAll(async () => {
  await db('site_content').where({ section: 'hero', key: 'title' }).delete();
  await db('faqs').where('question', 'like', `${prefix}%`).delete();
  await db('users').whereIn('id', [adminId, viewerId]).delete();
  await db.destroy();
});

describeIntegration('CMS (005)', () => {
  it('GET /site-content/public incluye hero tras PUT', async () => {
    const title = `${prefix} Hola`;
    const put = await request(app)
      .put('/api/v1/site-content/hero')
      .set('Authorization', `Bearer ${token(adminId)}`)
      .send({ entries: [{ key: 'title', value: title, type: 'text' }] });
    expect(put.status).toBe(200);

    const pub = await request(app).get('/api/v1/site-content/public');
    expect(pub.status).toBe(200);
    const heroTitle = pub.body.data.site_content.find((e) => e.section === 'hero' && e.key === 'title');
    expect(heroTitle?.value).toBe(title);
  });

  it('GET /faqs sin token solo activas', async () => {
    const [active] = await db('faqs')
      .insert({ question: `${prefix} A`, answer: 'a', sort_order: 0, is_active: true })
      .returning('id');
    await db('faqs').insert({
      question: `${prefix} Hidden`,
      answer: 'b',
      sort_order: 1,
      is_active: false,
    });

    const res = await request(app).get('/api/v1/faqs');
    expect(res.status).toBe(200);
    const qs = res.body.data.map((f) => f.question);
    expect(qs).toContain(`${prefix} A`);
    expect(qs).not.toContain(`${prefix} Hidden`);

    await db('faqs').where({ id: active.id }).delete();
    await db('faqs').where({ question: `${prefix} Hidden` }).delete();
  });

  it('GET /faqs/manage sin rol adecuado → 403', async () => {
    const res = await request(app)
      .get('/api/v1/faqs/manage')
      .set('Authorization', `Bearer ${token(viewerId)}`);
    expect(res.status).toBe(403);
  });

  it('GET /faqs/manage sin token → 401', async () => {
    const res = await request(app).get('/api/v1/faqs/manage');
    expect(res.status).toBe(401);
  });

  it('VIEWER no puede mutar site-content (SC-006)', async () => {
    const res = await request(app)
      .put('/api/v1/site-content/hero')
      .set('Authorization', `Bearer ${token(viewerId)}`)
      .send({ entries: [{ key: 'title', value: 'x', type: 'text' }] });
    expect(res.status).toBe(403);
  });
});
