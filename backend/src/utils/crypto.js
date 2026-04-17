'use strict';

const crypto = require('crypto');

/**
 * SHA256 hex used as recommended Idempotency-Key for POST /payments/create
 * (reservation_id + amount + currency, pipe-separated).
 * @param {string} reservationId UUID
 * @param {number|string} amount
 * @param {string} [currency='COP']
 * @returns {string} 64-char lowercase hex
 */
function hashPaymentIdempotencyKey(reservationId, amount, currency = 'COP') {
  const raw = `${reservationId}|${amount}|${currency}`;
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

module.exports = { hashPaymentIdempotencyKey };
