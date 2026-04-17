'use strict';

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const db = require('../../config/database');
const repo = require('./payments.repository');
const { ConflictError, ValidationError, NotFoundError } = require('../../middlewares/error-handler');

function getMpConfig() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    const err = new Error('MP_ACCESS_TOKEN is not configured');
    err.code = 'MP_NOT_CONFIGURED';
    throw err;
  }
  return new MercadoPagoConfig({ accessToken: token });
}

function amountsEqual(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.01;
}

/** Normaliza estado de Preference MP para comparar con intento interno (MVP). */
function preferenceLifecycleBucket(pref) {
  const raw = String(pref?.collection_status || pref?.status || '').toLowerCase();
  if (raw.includes('close') || raw === 'closed' || raw.includes('complete')) return 'closed';
  if (raw.includes('open') || raw === 'pending') return 'open';
  return raw || 'unknown';
}

function expectedBucketForAttempt(internalStatus) {
  const s = String(internalStatus || '').toLowerCase();
  if (s === 'approved') return 'closed';
  if (s === 'pending' || s === 'rejected' || s === 'expired') return 'open';
  return 'unknown';
}

async function createCheckoutPreference({ reservationId, amount, idempotencyKey }) {
  const reservation = await repo.findReservationById(reservationId);
  if (!reservation) throw new NotFoundError('Reservation not found');

  if (!['PENDING', 'PAYMENT_PENDING'].includes(reservation.status)) {
    throw new ConflictError(`Reservation status ${reservation.status} does not allow checkout`);
  }

  if (!amountsEqual(amount, reservation.total_amount)) {
    throw new ValidationError('Amount does not match reservation total_amount');
  }

  const apiBase = (process.env.API_URL || '').replace(/\/$/, '');
  const landingBase = (process.env.LANDING_URL || '').replace(/\/$/, '');
  if (!apiBase || !landingBase) {
    throw new ValidationError('API_URL and LANDING_URL must be set for payment URLs');
  }

  const cfg = getMpConfig();
  const preference = new Preference(cfg);

  // Checkout Pro con binary_mode: false permite PSE y métodos offline; la reserva solo pasa a
  // CONFIRMED cuando el webhook recibe pago MP `approved` (ver payments.webhook.service).
  const body = {
    items: [
      {
        id: reservation.id,
        title: `Reserva ${reservation.reservation_number}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'COP',
      },
    ],
    external_reference: reservation.id,
    notification_url: `${apiBase}/api/v1/payments/webhook`,
    back_urls: {
      success: `${landingBase}/success`,
      failure: `${landingBase}/failure`,
      pending: `${landingBase}/pending`,
    },
    binary_mode: false,
  };

  const mpRes = await preference.create({ body });
  const prefId = mpRes.id;
  const checkoutUrl = mpRes.sandbox_init_point || mpRes.init_point;

  return db.transaction(async (trx) => {
    const inserted = await trx('payment_attempts')
      .insert({
        reservation_id: reservationId,
        idempotency_key: idempotencyKey,
        preference_id: prefId,
        checkout_url: checkoutUrl,
        status: 'pending',
      })
      .returning('*');
    const attempt = Array.isArray(inserted) ? inserted[0] : inserted;

    if (reservation.status === 'PENDING') {
      await trx('reservations').where({ id: reservation.id }).update({ status: 'PAYMENT_PENDING', updated_at: trx.fn.now() });
    }

    return {
      preference_id: prefId,
      checkout_url: checkoutUrl,
      payment_attempt_id: attempt.id,
    };
  });
}

async function listReconciliation({ from, to, page, limit }) {
  const cfg = getMpConfig();
  const prefClient = new Preference(cfg);
  const offset = (page - 1) * limit;

  let base = db('payment_attempts');
  if (from) base = base.where('created_at', '>=', new Date(from));
  if (to) base = base.where('created_at', '<=', new Date(to));

  const countRow = await base.clone().count('* as c').first();
  const total = Number(countRow.c);
  const rows = await base.clone().select('*').orderBy('created_at', 'desc').offset(offset).limit(limit);

  const out = [];
  for (const row of rows) {
    let external_status = null;
    let mismatch = false;
    let mismatch_reason = null;
    if (row.preference_id) {
      try {
        const pref = await prefClient.get({ preferenceId: row.preference_id });
        external_status = pref?.collection_status || pref?.status || null;
        const extBucket = preferenceLifecycleBucket(pref);
        const expected = expectedBucketForAttempt(row.status);
        if (extBucket !== 'unknown' && expected !== 'unknown' && extBucket !== expected) {
          mismatch = true;
          mismatch_reason = `attempt=${row.status} expected_mp≈${expected} got=${extBucket}`;
        }
      } catch (e) {
        mismatch = true;
        mismatch_reason = e.message || 'MP preference fetch failed';
      }
    }
    out.push({
      payment_attempt_id: row.id,
      reservation_id: row.reservation_id,
      internal_status: row.status,
      external_status,
      mismatch,
      mismatch_reason,
    });
  }

  return { rows: out, total, page, limit };
}

module.exports = {
  createCheckoutPreference,
  listReconciliation,
  getMpConfig,
  Payment,
  Preference,
};
