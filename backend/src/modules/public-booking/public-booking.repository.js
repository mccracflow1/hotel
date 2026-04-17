'use strict';

const crypto = require('crypto');
const db = require('../../config/database');

function hashToken(plain) {
  return crypto.createHash('sha256').update(String(plain), 'utf8').digest('hex');
}

/**
 * @returns {Promise<string>} one-time plain token (show client once)
 */
async function insertCheckoutToken(reservationId) {
  const plain = crypto.randomBytes(32).toString('hex');
  const token_hash = hashToken(plain);
  const expires_at = new Date(Date.now() + 15 * 60 * 1000);
  await db('reservation_public_checkout_tokens').insert({
    reservation_id: reservationId,
    token_hash,
    expires_at,
  });
  return plain;
}

async function validateCheckoutToken(reservationId, plain) {
  const token_hash = hashToken(plain);
  const row = await db('reservation_public_checkout_tokens')
    .where({ reservation_id: reservationId, token_hash })
    .where('expires_at', '>', db.fn.now())
    .first();
  return !!row;
}

async function deleteTokensForReservation(reservationId) {
  await db('reservation_public_checkout_tokens').where({ reservation_id: reservationId }).delete();
}

module.exports = {
  insertCheckoutToken,
  validateCheckoutToken,
  deleteTokensForReservation,
  hashToken,
};
