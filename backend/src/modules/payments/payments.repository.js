'use strict';

const db = require('../../config/database');

async function findReservationById(id) {
  return db('reservations').where({ id }).first();
}

async function findPaymentAttemptByIdempotencyKey(key) {
  return db('payment_attempts').where({ idempotency_key: key }).first();
}

async function insertPaymentAttempt(trx, row) {
  const [r] = await trx('payment_attempts').insert(row).returning('*');
  return r;
}

async function updatePaymentAttempt(trx, id, patch) {
  const [r] = await trx('payment_attempts').where({ id }).update(patch).returning('*');
  return r;
}

async function findPaymentByExternalId(trx, externalId) {
  if (!externalId) return null;
  return trx('payments').where({ external_id: String(externalId) }).first();
}

async function insertPayment(trx, row) {
  const [r] = await trx('payments').insert(row).returning('*');
  return r;
}

async function updateReservationStatus(trx, id, status) {
  const [r] = await trx('reservations').where({ id }).update({ status, updated_at: trx.fn.now() }).returning('*');
  return r;
}

module.exports = {
  findReservationById,
  findPaymentAttemptByIdempotencyKey,
  insertPaymentAttempt,
  updatePaymentAttempt,
  findPaymentByExternalId,
  insertPayment,
  updateReservationStatus,
};
