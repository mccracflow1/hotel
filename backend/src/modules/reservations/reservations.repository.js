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
 */
async function checkAvailabilityRow(trx, roomId, planId, dateStart, dateEnd) {
  const end = dateEnd || dateStart;
  const res = await trx.raw('SELECT check_availability(?, ?, ?, ?) AS ok', [
    roomId,
    planId,
    dateStart,
    end,
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

  const avail = await checkAvailabilityRow(trx, roomId, planId, dateStart, dateEnd || dateStart);
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

module.exports = {
  allocateReservationNumber,
  checkAvailabilityRow,
  createReservationInTransaction,
};
