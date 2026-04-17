'use strict';

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '005-media-';
const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let adminId;
let viewerId;
let roomId;
let mediaId;

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  const email = `${prefix}admin@hotel.test`;
  await db('users').where({ email }).delete();
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [u] = await db('users')
    .insert({ email, password_hash: hash, name: 'Media Admin', role: 'ADMIN' })
    .returning('id');
  adminId = u.id;

  const vemail = `${prefix}viewer@hotel.test`;
  await db('users').where({ email: vemail }).delete();
  const [v] = await db('users')
    .insert({ email: vemail, password_hash: hash, name: 'Media Viewer', role: 'VIEWER' })
    .returning('id');
  viewerId = v.id;

  const slug = `${prefix}room-${randomUUID().slice(0, 8)}`;
  const [room] = await db('rooms')
    .insert({
      name: 'Media test room',
      slug,
      type: 'room',
      capacity: 2,
      base_price: 50,
      amenities: [],
      is_active: true,
      sort_order: 0,
    })
    .returning('id');
  roomId = room.id;
});

afterAll(async () => {
  await db('room_media').where({ room_id: roomId }).delete();
  if (mediaId) await db('media_library').where({ id: mediaId }).delete();
  await db('rooms').where({ id: roomId }).delete();
  await db('users').whereIn('id', [adminId, viewerId]).delete();
  await db.destroy();
});

describeIntegration('Media (005)', () => {
  it('POST /media/upload imagen → thumbnail_url', async () => {
    const res = await request(app)
      .post('/api/v1/media/upload')
      .set('Authorization', `Bearer ${token(adminId)}`)
      .attach('file', png1x1, { filename: 't.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.thumbnail_url).toBeTruthy();
    mediaId = res.body.data.id;
  });

  it('VIEWER no puede subir (SC-006)', async () => {
    const res = await request(app)
      .post('/api/v1/media/upload')
      .set('Authorization', `Bearer ${token(viewerId)}`)
      .attach('file', png1x1, { filename: 't.png', contentType: 'image/png' });
    expect(res.status).toBe(403);
  });

  it('DELETE /media/:id en uso en room_media → 409', async () => {
    await request(app)
      .post(`/api/v1/rooms/${roomId}/media`)
      .set('Authorization', `Bearer ${token(adminId)}`)
      .send({ media_id: mediaId, is_cover: true, sort_order: 0 });

    const del = await request(app)
      .delete(`/api/v1/media/${mediaId}`)
      .set('Authorization', `Bearer ${token(adminId)}`);
    expect(del.status).toBe(409);
  });
});
