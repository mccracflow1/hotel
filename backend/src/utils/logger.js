const winston = require('winston');

// PII fields to redact from full payloads
const PII_FIELDS = ['password', 'password_hash', 'token', 'credit_card', 'cvv', 'customer_document'];

function redactPII(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(redacted)) {
    if (PII_FIELDS.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactPII(redacted[key]);
    }
  }
  return redacted;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Log basic text message
logger.logText = (level, message, meta = {}) => {
  logger[level](message, meta);
};

// Log full payload (PII-safe)
logger.logPayload = (level, message, payload) => {
  logger[level](message, { payload: redactPII(payload) });
};

module.exports = logger;
