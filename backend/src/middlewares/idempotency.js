'use strict';

const db = require('../config/database');
const logger = require('../utils/logger');
const { AppError } = require('./error-handler');

const OPS = {
  RESERVATION_CREATE: 'reservation:create',
  RESERVATION_UPDATE: 'reservation:update',
  RESERVATION_CANCEL: 'reservation:cancel',
  RESERVATION_OPTIONAL_ADD: 'reservation:optional-add',
  INVENTORY_MOVEMENT_CREATE: 'inventory:movement',
};

/**
 * Lenient idempotency: optional Idempotency-Key; on DB error proceeds (non-critical paths).
 */
async function idempotency(req, res, next) {
  return runIdempotency(req, res, next, { requireKey: false, failClosed: false });
}

/**
 * Strict idempotency for POST /reservations: Key required; DB errors fail closed; replays cached status+body.
 */
async function idempotencyReservationCreate(req, res, next) {
  return runIdempotency(req, res, next, {
    requireKey: true,
    failClosed: true,
    operation: OPS.RESERVATION_CREATE,
  });
}

function idempotencyStrict(operation) {
  return function idempotencyStrictMw(req, res, next) {
    return runIdempotency(req, res, next, {
      requireKey: true,
      failClosed: true,
      operation,
    });
  };
}

const idempotencyReservationUpdate = idempotencyStrict(OPS.RESERVATION_UPDATE);
const idempotencyReservationCancel = idempotencyStrict(OPS.RESERVATION_CANCEL);
const idempotencyReservationOptionalAdd = idempotencyStrict(OPS.RESERVATION_OPTIONAL_ADD);
const idempotencyInventoryMovement = idempotencyStrict(OPS.INVENTORY_MOVEMENT_CREATE);

async function runIdempotency(req, res, next, options) {
  const { requireKey, failClosed, operation } = options;
  const key = req.headers['idempotency-key'];

  if (!key) {
    if (requireKey) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Idempotency-Key header is required for this operation',
          details: null,
        },
      });
    }
    return next();
  }

  if (key.length > 128) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Idempotency-Key must be 128 characters or fewer',
        details: null,
      },
    });
  }

  try {
    const existing = await db('idempotency_keys')
      .where({ key })
      .where('expires_at', '>', db.fn.now())
      .first();

    if (existing && existing.response_body != null) {
      logger.logText('info', 'Idempotency cache hit', { key, operation: existing.operation });
      const status = existing.response_status || 200;
      return res.status(status).json(existing.response_body);
    }

    req.idempotencyKey = key;
    req.idempotencyOperation = operation || OPS.RESERVATION_CREATE;

    const origJson = res.json.bind(res);
    res.json = function idempotentJsonWrapper(body) {
      const statusCode = res.statusCode || 200;
      const op = req.idempotencyOperation || OPS.RESERVATION_CREATE;
      return db('idempotency_keys')
        .insert({
          key: req.idempotencyKey,
          operation: op,
          response_status: statusCode,
          response_body: body,
          expires_at: db.raw("NOW() + INTERVAL '24 hours'"),
        })
        .onConflict('key')
        .merge({
          operation: op,
          response_status: statusCode,
          response_body: body,
          expires_at: db.raw("NOW() + INTERVAL '24 hours'"),
        })
        .then(() => origJson(body))
        .catch((err) => {
          logger.logText('error', 'Idempotency persist failed', { key: req.idempotencyKey, error: err.message });
          return origJson(body);
        });
    };

    return next();
  } catch (err) {
    logger.logText('warn', 'Idempotency check failed', { key, error: err.message });
    if (failClosed) {
      return next(
        new AppError('SERVICE_UNAVAILABLE', 'Idempotency store unavailable', 503, { reason: err.message })
      );
    }
    return next();
  }
}

module.exports = {
  idempotency,
  idempotencyReservationCreate,
  idempotencyReservationUpdate,
  idempotencyReservationCancel,
  idempotencyReservationOptionalAdd,
  idempotencyInventoryMovement,
  idempotencyStrict,
  OPS,
};
