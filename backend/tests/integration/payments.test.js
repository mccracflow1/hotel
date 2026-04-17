'use strict';

const mockPrefCreate = jest.fn();
const mockPrefGet = jest.fn();
const mockPayGet = jest.fn();

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  Preference: class Preference {
    create(...args) {
      return mockPrefCreate(...args);
    }

    get(...args) {
      return mockPrefGet(...args);
    }
  },
  Payment: class Payment {
    get(...args) {
      return mockPayGet(...args);
    }
  },
}));

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { randomUUID } = require('crypto');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIntegration = process.env.DATABASE_URL ? describe : describe.skip;

const prefix = '005-pay-';
let agentId;
let adminId;
let roomId;
let reservationId;
let reservationNumber;
const totalAmount = 150000;

function token(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { algorithm: 'HS256' });
}

function signedWebhookHeaders(dataId, secret) {
  const ts = String(Math.floor(Date.now() / 1000));
  const xRequestId = 'req-test-1';
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return {
    'x-signature': `ts=${ts},v1=${v1}`,
    'x-request-id': xRequestId,
  };
}

async function flushPaymentData() {
  await db('payments').where({ reservation_id: reservationId }).delete();
  await db('payment_attempts').where({ reservation_id: reservationId }).delete();
  await db('idempotency_keys').where('key', 'like', `${prefix}%`).delete();
}

beforeAll(async () => {
  process.env.MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'test-token';
  process.env.API_URL = process.env.API_URL || 'http://localhost:3000';
  process.env.LANDING_URL = process.env.LANDING_URL || 'http://localhost:5173';
  process.env.MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || 'whsec-test';

  mockPrefCreate.mockResolvedValue({
    id: 'pref-test-1',
    init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-test-1',
    sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-test-1',
  });
  mockPrefGet.mockResolvedValue({ id: 'pref-test-1', collection_status: 'closed', status: 'closed' });
  mockPayGet.mockReset();

  const agentEmail = `${prefix}agent@hotel.test`;
  const adminEmail = `${prefix}admin@hotel.test`;
  await db('users').whereIn('email', [agentEmail, adminEmail]).delete();
  const hash = await bcrypt.hash('TestPass1!', 12);
  const [a] = await db('users')
    .insert({ email: agentEmail, password_hash: hash, name: 'Pay Agent', role: 'AGENT' })
    .returning('id');
  agentId = a.id;
  const [adm] = await db('users')
    .insert({ email: adminEmail, password_hash: hash, name: 'Pay Admin', role: 'ADMIN' })
    .returning('id');
  adminId = adm.id;

  const slug = `${prefix}room-${randomUUID().slice(0, 8)}`;
  await db('rooms').where({ slug }).delete();
  const [room] = await db('rooms')
    .insert({
      name: 'Pay test room',
      slug,
      type: 'room',
      capacity: 2,
      base_price: 100,
      amenities: [],
      is_active: true,
      sort_order: 0,
    })
    .returning('id');
  roomId = room.id;

  reservationNumber = `HT-2099-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  await db('reservations').where({ reservation_number: reservationNumber }).delete();
  const [res] = await db('reservations')
    .insert({
      reservation_number: reservationNumber,
      room_id: roomId,
      plan_id: null,
      customer_name: 'Test',
      customer_document: '1',
      customer_phone: '1',
      date_start: '2099-06-01',
      date_end: null,
      adults: 1,
      children: 0,
      status: 'PENDING',
      total_amount: totalAmount,
      version: 0,
    })
    .returning('id');
  reservationId = res.id;

  await db('reservation_activity_snapshot').insert({
    reservation_id: reservationId,
    activity_name: 'Base',
    extra_cost: 0,
    sort_order: 0,
  });
});

afterAll(async () => {
  await flushPaymentData();
  await db('reservation_activity_snapshot').where({ reservation_id: reservationId }).delete();
  await db('reservations').where({ id: reservationId }).delete();
  await db('rooms').where({ id: roomId }).delete();
  await db('users').whereIn('id', [agentId, adminId]).delete();
  await db.destroy();
});

describeIntegration('Payments (005)', () => {
  beforeEach(async () => {
    await flushPaymentData();
    await db('reservations').where({ id: reservationId }).update({ status: 'PENDING', updated_at: db.fn.now() });
    mockPayGet.mockReset();
    mockPrefCreate.mockClear();
  });

  it('POST /payments/create sin Idempotency-Key → 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create')
      .set('Authorization', `Bearer ${token(agentId)}`)
      .send({ reservation_id: reservationId, amount: totalAmount });
    expect(res.status).toBe(400);
  });

  it('POST /payments/create idempotente + Preference mock', async () => {
    const idem = `${prefix}idem-${randomUUID()}`;
    const body = { reservation_id: reservationId, amount: totalAmount };

    const r1 = await request(app)
      .post('/api/v1/payments/create')
      .set('Authorization', `Bearer ${token(agentId)}`)
      .set('Idempotency-Key', idem)
      .send(body);
    expect(r1.status).toBe(201);
    expect(r1.body.data.preference_id).toBe('pref-test-1');

    const r2 = await request(app)
      .post('/api/v1/payments/create')
      .set('Authorization', `Bearer ${token(agentId)}`)
      .set('Idempotency-Key', idem)
      .send(body);
    expect(r2.status).toBe(201);
    expect(r2.body).toEqual(r1.body);
    expect(mockPrefCreate).toHaveBeenCalledTimes(1);
  });

  it('webhook approved confirma reserva + dedupe external_id', async () => {
    const idem = `${prefix}w1-${randomUUID()}`;
    await request(app)
      .post('/api/v1/payments/create')
      .set('Authorization', `Bearer ${token(agentId)}`)
      .set('Idempotency-Key', idem)
      .send({ reservation_id: reservationId, amount: totalAmount });

    const payId = '123456789';
    mockPayGet.mockResolvedValue({
      status: 'approved',
      external_reference: reservationId,
      transaction_amount: totalAmount,
      currency_id: 'COP',
      payment_type_id: 'credit_card',
    });

    const snapBefore = await db('reservation_activity_snapshot').where({ reservation_id: reservationId });

    const hdr = signedWebhookHeaders(payId, process.env.MP_WEBHOOK_SECRET);
    await request(app).post('/api/v1/payments/webhook').query({ 'data.id': payId }).set(hdr).send({});

    await new Promise((r) => setTimeout(r, 150));

    const row = await db('reservations').where({ id: reservationId }).first();
    expect(row.status).toBe('CONFIRMED');
    const pays = await db('payments').where({ external_id: payId });
    expect(pays.length).toBe(1);

    const snapAfter = await db('reservation_activity_snapshot').where({ reservation_id: reservationId });
    expect(snapAfter.length).toBe(snapBefore.length);

    await request(app).post('/api/v1/payments/webhook').query({ 'data.id': payId }).set(hdr).send({});
    await new Promise((r) => setTimeout(r, 150));
    const pays2 = await db('payments').where({ external_id: payId });
    expect(pays2.length).toBe(1);
  });

  it('webhook pending (PSE) no confirma', async () => {
    const idem = `${prefix}pse-${randomUUID()}`;
    await request(app)
      .post('/api/v1/payments/create')
      .set('Authorization', `Bearer ${token(agentId)}`)
      .set('Idempotency-Key', idem)
      .send({ reservation_id: reservationId, amount: totalAmount });

    mockPayGet.mockResolvedValue({
      status: 'pending',
      external_reference: reservationId,
      transaction_amount: totalAmount,
      currency_id: 'COP',
    });

    const hdr = signedWebhookHeaders('999888777', process.env.MP_WEBHOOK_SECRET);
    await request(app).post('/api/v1/payments/webhook').query({ 'data.id': '999888777' }).set(hdr).send({});
    await new Promise((r) => setTimeout(r, 150));

    const row = await db('reservations').where({ id: reservationId }).first();
    expect(['PENDING', 'PAYMENT_PENDING'].includes(row.status)).toBe(true);
    const pays = await db('payments').where({ reservation_id: reservationId });
    expect(pays.length).toBe(0);
  });

  it('firma inválida no llama MP ni muta', async () => {
    mockPayGet.mockClear();
    await request(app)
      .post('/api/v1/payments/webhook')
      .query({ 'data.id': '111' })
      .set({ 'x-signature': 'ts=1,v1=deadbeef', 'x-request-id': 'x' })
      .send({});
    await new Promise((r) => setTimeout(r, 80));
    expect(mockPayGet).not.toHaveBeenCalled();
  });

  it('GET /payments/reconciliation mismatch cuando MP distinto', async () => {
    await db('payment_attempts')
      .insert({
        reservation_id: reservationId,
        idempotency_key: `${prefix}rec-${randomUUID()}`,
        preference_id: 'pref-rec-1',
        checkout_url: 'http://x',
        status: 'pending',
      })
      .returning('id');

    mockPrefGet.mockResolvedValueOnce({ id: 'pref-rec-1', collection_status: 'closed', status: 'closed' });

    const res = await request(app)
      .get('/api/v1/payments/reconciliation')
      .set('Authorization', `Bearer ${token(adminId)}`);
    expect(res.status).toBe(200);
    const row = res.body.data.find((r) => r.mismatch === true);
    expect(row).toBeDefined();
    expect(row.internal_status).toBe('pending');
  });
});
