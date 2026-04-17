'use strict';

/**
 * @param {import('knex').Knex.Transaction} trx
 */
async function allocateReservationNumber(trx) {
  const year = new Date().getFullYear();
  await trx.raw(
    `INSERT INTO reservation_number_sequences (year, last_value) VALUES (?, 0)
     ON CONFLICT (year) DO NOTHING`,
    [year]
  );
  const row = await trx('reservation_number_sequences').where({ year }).forUpdate().first();
  const next = Number(row.last_value) + 1;
  await trx('reservation_number_sequences').where({ year }).update({ last_value: next });
  return `HT-${year}-${String(next).padStart(5, '0')}`;
}

/**
 * @param {import('knex').Knex.Transaction} trx
 * @param {string|null} excludeReservationId
 */
async function checkAvailabilityRow(trx, roomId, planId, dateStart, dateEnd, excludeReservationId = null) {
  const end = dateEnd || dateStart;
  const res = await trx.raw('SELECT check_availability(?, ?, ?, ?, ?) AS ok', [
    roomId,
    planId,
    dateStart,
    end,
    excludeReservationId,
  ]);
  const ok = res.rows[0]?.ok;
  return ok === true || ok === 't' || ok === true;
}

async function createReservationInTransaction(trx, dto, meta) {
  const {
    reservationNumber,
    totalAmount,
    snapshotRows,
    optionalRows,
    roomId,
    planId,
    dateStart,
    dateEnd,
  } = meta;

  const avail = await checkAvailabilityRow(trx, roomId, planId, dateStart, dateEnd || dateStart, null);
  if (!avail) {
    const err = new Error('NOT_AVAILABLE');
    err.code = 'NOT_AVAILABLE';
    throw err;
  }

  const [reservation] = await trx('reservations')
    .insert({
      reservation_number: reservationNumber,
      room_id: roomId,
      plan_id: planId,
      customer_name: dto.customer_name,
      customer_document: dto.customer_document,
      customer_email: dto.customer_email || null,
      customer_phone: dto.customer_phone,
      date_start: dateStart,
      date_end: dateEnd || null,
      adults: dto.adults,
      children: dto.children ?? 0,
      status: 'PENDING',
      total_amount: totalAmount,
      notes: dto.notes || null,
      created_by: meta.createdBy ?? null,
    })
    .returning('*');

  for (const snap of snapshotRows) {
    await trx('reservation_activity_snapshot').insert({
      reservation_id: reservation.id,
      activity_name: snap.activity_name,
      description: snap.description ?? null,
      extra_cost: snap.extra_cost ?? 0,
      sort_order: snap.sort_order ?? 0,
    });
  }

  for (const opt of optionalRows) {
    await trx('reservation_optional_activities').insert({
      reservation_id: reservation.id,
      optional_activity_id: opt.optional_activity_id,
      activity_name_snapshot: opt.activity_name_snapshot,
      price_snapshot: opt.price_snapshot,
      quantity: opt.quantity ?? 1,
    });
  }

  return reservation;
}

/**
 * @param {import('knex').Knex} db
 */
function buildReservationListQuery(db, filters) {
  let q = db('reservations as r').select('r.*');

  if (filters.status) {
    q = q.where('r.status', filters.status);
  }
  if (filters.date_from) {
    q = q.where('r.date_start', '>=', filters.date_from);
  }
  if (filters.date_to) {
    q = q.where('r.date_start', '<=', filters.date_to);
  }
  if (filters.room_id) {
    q = q.where('r.room_id', filters.room_id);
  }
  if (filters.plan_id) {
    q = q.where('r.plan_id', filters.plan_id);
  }
  if (filters.q && String(filters.q).trim()) {
    const term = `%${String(filters.q).trim()}%`;
    q = q.where(function whereSearch() {
      this.whereILike('r.customer_name', term)
        .orWhereILike('r.customer_document', term)
        .orWhereILike('r.customer_phone', term);
    });
  }
  return q;
}

async function countReservations(db, filters) {
  // clearSelect() quita el select('r.*') aplicado por buildReservationListQuery
  // para que el count() genere un SELECT agregado válido (sin GROUP BY).
  const row = await buildReservationListQuery(db, filters)
    .clone()
    .clearSelect()
    .count('r.id as c')
    .first();
  return Number(row?.c || 0);
}

async function listReservations(db, filters, page, limit) {
  const offset = (page - 1) * limit;
  return buildReservationListQuery(db, filters)
    .orderBy('r.created_at', 'desc')
    .limit(limit)
    .offset(offset);
}

async function getReservationBase(db, id) {
  return db('reservations').where({ id }).first();
}

async function getReservationByNumber(db, reservationNumber) {
  return db('reservations').where({ reservation_number: reservationNumber }).first();
}

async function loadReservationDetail(db, reservationId) {
  const r = await db('reservations as r').where('r.id', reservationId).first();
  if (!r) return null;

  let plan = null;
  let room = null;
  if (r.plan_id) {
    plan = await db('plans').where({ id: r.plan_id }).first();
  }
  if (r.room_id) {
    room = await db('rooms').where({ id: r.room_id }).first();
  }

  const activities_snapshot = await db('reservation_activity_snapshot')
    .where({ reservation_id: reservationId })
    .orderBy('sort_order', 'asc');

  const optional_activities = await db('reservation_optional_activities')
    .where({ reservation_id: reservationId })
    .orderBy('activity_name_snapshot', 'asc');

  return {
    ...r,
    plan,
    room,
    activities_snapshot,
    optional_activities,
  };
}

module.exports = {
  allocateReservationNumber,
  checkAvailabilityRow,
  createReservationInTransaction,
  buildReservationListQuery,
  countReservations,
  listReservations,
  getReservationBase,
  getReservationByNumber,
  loadReservationDetail,
};
