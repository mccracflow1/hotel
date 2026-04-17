'use strict';

const db = require('../../config/database');
const logger = require('../../utils/logger');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { verifyMercadoPagoWebhook, extractPaymentDataId } = require('./mp-webhook.verify');
const repo = require('./payments.repository');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPaymentWithBackoff(paymentClient, id) {
  let lastErr;
  const delays = [0, 1000, 2000, 4000];
  for (const ms of delays) {
    if (ms) await sleep(ms);
    try {
      // eslint-disable-next-line no-await-in-loop
      return await paymentClient.get({ id });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/**
 * Background processing after responding 200 to MercadoPago.
 * @param {import('express').Request} req
 */
async function processPaymentNotification(req) {
  const dataId = extractPaymentDataId(req);
  if (!dataId) {
    logger.logText('warn', 'MP webhook: missing data.id', { query: req.query });
    return;
  }

  const secret = process.env.MP_WEBHOOK_SECRET || '';
  const xSig = req.headers['x-signature'] || req.headers['X-Signature'];
  const xReq = req.headers['x-request-id'] || req.headers['X-Request-Id'] || '';
  if (secret && !verifyMercadoPagoWebhook({ dataId, xSignature: xSig, xRequestId: xReq, secret })) {
    logger.logText('warn', 'MP webhook: invalid signature (ignored)', { dataId });
    return;
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    logger.logText('error', 'MP webhook: MP_ACCESS_TOKEN missing');
    return;
  }

  const cfg = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const paymentClient = new Payment(cfg);

  let payment;
  try {
    payment = await fetchPaymentWithBackoff(paymentClient, dataId);
  } catch (e) {
    logger.logText('error', 'MP webhook: failed to fetch payment', { dataId, error: e.message });
    return;
  }

  const status = payment.status;
  const reservationId = payment.external_reference;

  if (!reservationId) {
    logger.logText('warn', 'MP webhook: payment without external_reference', { dataId });
    return;
  }

  if (status !== 'approved') {
    logger.logText('info', 'MP webhook: payment not approved, skipping confirm', { dataId, status });
    return;
  }

  let confirmed = false;
  await db.transaction(async (trx) => {
    const existing = await repo.findPaymentByExternalId(trx, String(dataId));
    if (existing) return;

    const reservation = await trx('reservations').where({ id: reservationId }).forUpdate().first();
    if (!reservation) {
      logger.logText('warn', 'MP webhook: reservation not found', { reservationId, dataId });
      return;
    }

    if (!['PENDING', 'PAYMENT_PENDING'].includes(reservation.status)) {
      logger.logText('warn', 'MP webhook: skip confirm for reservation status', {
        reservationId,
        status: reservation.status,
        dataId,
      });
      return;
    }

    const amount = Number(payment.transaction_amount);
    await repo.insertPayment(trx, {
      reservation_id: reservation.id,
      amount,
      currency: (payment.currency_id || 'COP').slice(0, 3),
      payment_method: payment.payment_type_id || payment.payment_method_id || 'mercadopago_checkout',
      external_id: String(dataId),
      status: 'confirmed',
      confirmed_at: trx.fn.now(),
    });

    await repo.updateReservationStatus(trx, reservation.id, 'CONFIRMED');

    await trx('payment_attempts')
      .where({ reservation_id: reservation.id })
      .whereNotNull('preference_id')
      .update({ status: 'approved' });

    confirmed = true;
  });

  if (confirmed) {
    logger.logText('info', 'MP webhook: reservation confirmed', { dataId, reservationId });
  }
}

module.exports = { processPaymentNotification };
