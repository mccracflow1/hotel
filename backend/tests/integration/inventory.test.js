'use strict';

/**
 * T033 — stock no negativo + replay idempotente en POST /inventory/movements.
 */

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '004-inv-';
let businessId;
let itemId;

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

beforeAll(async () => {
  const bizEmail = `${prefix}biz@hotel.test`;
  await db('users').where({ email: bizEmail }).delete();
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [b] = await db('users')
    .insert({ email: bizEmail, password_hash: hash, name: 'Inv Biz', role: 'BUSINESS' })
    .returning('id');
  businessId = b.id;

  const [item] = await db('inventory_items')
    .insert({
      name: `${prefix}test-item`,
      category: 'other',
      unit: 'u',
      current_stock: 2,
      min_stock: 0,
      is_active: true,
    })
    .returning('id');
  itemId = item.id;
});

afterAll(async () => {
  await db('inventory_movements').where({ item_id: itemId }).delete();
  await db('inventory_items').where({ id: itemId }).delete();
  await db('idempotency_keys').where('key', 'like', `${prefix}%`).delete();
  await db('users').where('email', 'like', `${prefix}%`).delete();
  await db.destroy();
});

describeIntegration('Inventory (004)', () => {
  it('EXIT que excede stock → error sin cambio persistente', async () => {
    const before = await db('inventory_items').where({ id: itemId }).first();
    const res = await request(app)
      .post('/api/v1/inventory/movements')
      .set('Authorization', `Bearer ${token(businessId)}`)
      .set('Idempotency-Key', randomUUID())
      .send({ item_id: itemId, type: 'EXIT', quantity: 50, notes: 'test' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const after = await db('inventory_items').where({ id: itemId }).first();
    expect(Number(after.current_stock)).toBe(Number(before.current_stock));
  });

  it('mismo Idempotency-Key replay → mismo cuerpo y una sola aplicación', async () => {
    await db('inventory_items').where({ id: itemId }).update({ current_stock: 10 });
    const key = `${prefix}idem-${randomUUID()}`;
    const body = { item_id: itemId, type: 'EXIT', quantity: 3, notes: 'idem' };

    const r1 = await request(app)
      .post('/api/v1/inventory/movements')
      .set('Authorization', `Bearer ${token(businessId)}`)
      .set('Idempotency-Key', key)
      .send(body);

    const r2 = await request(app)
      .post('/api/v1/inventory/movements')
      .set('Authorization', `Bearer ${token(businessId)}`)
      .set('Idempotency-Key', key)
      .send(body);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(r1.status);
    expect(JSON.stringify(r2.body)).toBe(JSON.stringify(r1.body));

    const row = await db('inventory_items').where({ id: itemId }).first();
    expect(Number(row.current_stock)).toBe(7);
  });
});
