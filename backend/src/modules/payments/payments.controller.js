'use strict';

const { createPaymentBodySchema } = require('./payments.schema');
const paymentsService = require('./payments.service');
const { processPaymentNotification } = require('./payments.webhook.service');
const { ValidationError } = require('../../middlewares/error-handler');
const logger = require('../../utils/logger');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function createPayment(req, res, next) {
  try {
    const body = validate(createPaymentBodySchema, req.body);
    const idempotencyKey = req.headers['idempotency-key'];
    const data = await paymentsService.createCheckoutPreference({
      reservationId: body.reservation_id,
      amount: body.amount,
      idempotencyKey,
    });
    return res.status(201).json({ data });
  } catch (err) {
    if (err.code === 'MP_NOT_CONFIGURED') {
      return res.status(503).json({
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Payment provider not configured', details: null },
      });
    }
    return next(err);
  }
}

function postWebhook(req, res, next) {
  res.status(200).type('text/plain').send('OK');
  setImmediate(() => {
    processPaymentNotification(req).catch((err) => {
      req.app?.locals?.logger?.error?.(err);
      logger.logText('error', 'MP webhook async error', { error: err.message });
    });
  });
}

async function getReconciliation(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const { rows, total } = await paymentsService.listReconciliation({
      from: req.query.from,
      to: req.query.to,
      page,
      limit,
    });
    return res.status(200).json({ data: rows, meta: { page, limit, total } });
  } catch (err) {
    if (err.code === 'MP_NOT_CONFIGURED') {
      return res.status(503).json({
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Payment provider not configured', details: null },
      });
    }
    return next(err);
  }
}

module.exports = { createPayment, postWebhook, getReconciliation };
