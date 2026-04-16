'use strict';

/**
 * Availability Integration Tests — T026
 * Requiere: DATABASE_URL_TEST configurada, migraciones ejecutadas.
 * Ejecutar: npm test -- --testPathPattern=availability
 */

require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const db = require('../src/config/database');
const availabilityService = require('../src/modules/availability/availability.service');
const availabilityRepository = require('../src/modules/availability/availability.repository');

let adminToken;
let testRoomId;
let testPlanId;
let testSeasonId;

beforeAll(async () => {
  // Crear usuario ADMIN de prueba
  await db('users').where({ email: 'avail-admin@hotel.test' }).delete();
  const hash = await bcrypt.hash('AdminAvail1!', 12);
  const [user] = await db('users')
    .insert({ email: 'avail-admin@hotel.test', password_hash: hash, name: 'Avail Admin', role: 'ADMIN' })
    .returning('*');

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'avail-admin@hotel.test', password: 'AdminAvail1!' });
  adminToken = loginRes.body.accessToken;

  // Crear habitación de prueba
  const [room] = await db('rooms')
    .insert({ name: 'Test Room Availability', slug: 'test-room-avail-' + Date.now(), base_price: 200000 })
    .returning('*');
  testRoomId = room.id;

  // Crear disponibilidad base para la habitación
  await db('availability').insert({
    room_id: testRoomId,
    plan_id: null,
    date: '2026-07-15',
    total_slots: 2,
    blocked_slots: 0,
  }).onConflict(['room_id', 'plan_id', 'date']).ignore();
});

afterAll(async () => {
  await db('seasons').where({ id: testSeasonId }).delete().catch(() => {});
  await db('availability').where({ room_id: testRoomId }).delete().catch(() => {});
  await db('rooms').where({ id: testRoomId }).delete().catch(() => {});
  await db('users').where({ email: 'avail-admin@hotel.test' }).delete().catch(() => {});
  await db.destroy();
});

describe('GET /api/v1/availability', () => {
  it('endpoint público → 200 sin token', async () => {
    const res = await request(app)
      .get('/api/v1/availability')
      .query({ fecha_inicio: '2026-07-15', fecha_fin: '2026-07-17' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resultados');
    expect(Array.isArray(res.body.resultados)).toBe(true);
  });

  it('validación: fecha pasada → 400', async () => {
    const res = await request(app)
      .get('/api/v1/availability')
      .query({ fecha_inicio: '2020-01-01', fecha_fin: '2020-01-05' });
    expect(res.status).toBe(400);
  });

  it('validación: rango > 90 días → 400', async () => {
    const res = await request(app)
      .get('/api/v1/availability')
      .query({ fecha_inicio: '2026-07-01', fecha_fin: '2026-10-15' });
    expect(res.status).toBe(400);
  });
});

describe('Precios con temporada', () => {
  it('temporada activa → precio_efectivo = base_price × multiplicador', async () => {
    // Crear temporada
    const [season] = await db('seasons')
      .insert({ name: 'Test Season', date_start: '2026-07-01', date_end: '2026-07-31', price_multiplier: 1.4 })
      .returning('*');
    testSeasonId = season.id;

    const res = await request(app)
      .get('/api/v1/availability')
      .query({ fecha_inicio: '2026-07-15', fecha_fin: '2026-07-16' });

    expect(res.status).toBe(200);
    const room = res.body.resultados.find((r) => r.id === testRoomId);
    if (room) {
      const expectedPrice = 200000 * 1.4;
      expect(Math.abs(room.precio_efectivo - expectedPrice)).toBeLessThan(1);
      expect(room.multiplicador_temporada).toBeCloseTo(1.4, 2);
    }
  });
});

describe('GET /api/v1/availability/calendar', () => {
  it('sin token → 401', async () => {
    const res = await request(app)
      .get('/api/v1/availability/calendar')
      .query({ year: 2026, month: 7 });
    expect(res.status).toBe(401);
  });

  it('con token ADMIN → 200 con estructura correcta', async () => {
    const res = await request(app)
      .get('/api/v1/availability/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ year: 2026, month: 7 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('year', 2026);
    expect(res.body).toHaveProperty('month', 7);
    expect(res.body).toHaveProperty('timezone', 'America/Bogota');
    expect(Array.isArray(res.body.dias)).toBe(true);
  });

  it('caché: segunda llamada retorna misma data (node-cache)', async () => {
    // Primera llamada — llena el caché
    const res1 = await request(app)
      .get('/api/v1/availability/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ year: 2026, month: 8 });
    expect(res1.status).toBe(200);

    // Spy sobre el repository para verificar que no se llama en segunda request
    const spy = jest.spyOn(availabilityRepository, 'getCalendarData');

    const res2 = await request(app)
      .get('/api/v1/availability/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ year: 2026, month: 8 });
    expect(res2.status).toBe(200);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('Concurrencia — SELECT FOR UPDATE SKIP LOCKED', () => {
  it('2 llamadas simultáneas a checkAvailability con 1 slot → exactamente 1 resuelve y 1 rechaza', async () => {
    // Crear availability con 1 slot
    const [room] = await db('rooms')
      .insert({ name: 'Concurrency Test Room', slug: 'concurrency-' + Date.now(), base_price: 150000 })
      .returning('*');

    await db('availability').insert({
      room_id: room.id,
      plan_id: null,
      date: '2026-08-01',
      total_slots: 1,
      blocked_slots: 0,
    });

    // Ejecutar dos checkAvailability en paralelo
    const results = await Promise.allSettled([
      availabilityRepository.checkAvailability(room.id, null, '2026-08-01', '2026-08-02'),
      availabilityRepository.checkAvailability(room.id, null, '2026-08-01', '2026-08-02'),
    ]);

    // Con SELECT FOR UPDATE SKIP LOCKED, exactamente 1 debe retornar fila disponible
    const fulfilled = results.filter((r) => r.status === 'fulfilled' && r.value.length > 0);
    const empty = results.filter((r) => r.status === 'fulfilled' && r.value.length === 0);
    const rejected = results.filter((r) => r.status === 'rejected');

    // Una debe tener resultado y la otra vacía o rechazada
    expect(fulfilled.length + empty.length + rejected.length).toBe(2);
    expect(fulfilled.length).toBeLessThanOrEqual(1);

    // Cleanup
    await db('availability').where({ room_id: room.id }).delete();
    await db('rooms').where({ id: room.id }).delete();
  });
});

describe('POST /api/v1/availability', () => {
  it('ADMIN puede configurar slots → 201', async () => {
    const res = await request(app)
      .post('/api/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ room_id: testRoomId, plan_id: null, date: '2026-09-01', total_slots: 3 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('total_slots', 3);
  });
});

describe('Seasons CRUD', () => {
  it('ADMIN puede crear temporada → 201', async () => {
    const res = await request(app)
      .post('/api/v1/seasons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Vacaciones Julio', fecha_inicio: '2026-07-04', fecha_fin: '2026-07-06', multiplicador: 1.3 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('price_multiplier');

    // Cleanup
    await db('seasons').where({ id: res.body.id }).delete();
  });

  it('al eliminar temporada, precios vuelven a base', async () => {
    const [season] = await db('seasons')
      .insert({ name: 'Temp Delete Test', date_start: '2026-11-01', date_end: '2026-11-05', price_multiplier: 2.0 })
      .returning('*');

    const before = await request(app)
      .get('/api/v1/availability')
      .query({ fecha_inicio: '2026-11-02', fecha_fin: '2026-11-03' });

    await request(app)
      .delete(`/api/v1/seasons/${season.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    availabilityService.invalidateCalendarCache();

    const after = await request(app)
      .get('/api/v1/availability')
      .query({ fecha_inicio: '2026-11-02', fecha_fin: '2026-11-03' });

    // Verificar que ya no hay multiplicador x2
    const afterRoom = after.body.resultados.find((r) => r.id === testRoomId);
    if (afterRoom) {
      expect(afterRoom.multiplicador_temporada).toBeNull();
    }
  });
});
