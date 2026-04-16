const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Idempotency middleware skeleton.
 * Checks the `Idempotency-Key` header and returns cached response if duplicate.
 * Full implementation (persisting responses) will complete in Semana 2.
 */
async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];

  if (!key) {
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

    if (existing && existing.response_body) {
      logger.logText('info', 'Idempotency cache hit', { key });
      return res.status(200).json(existing.response_body);
    }

    req.idempotencyKey = key;
    return next();
  } catch (err) {
    // Non-blocking: if idempotency check fails, proceed anyway
    logger.logText('warn', 'Idempotency check failed, proceeding', { key, error: err.message });
    return next();
  }
}

module.exports = { idempotency };
