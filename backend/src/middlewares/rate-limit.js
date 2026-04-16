'use strict';

const rateLimit = require('express-rate-limit');

/**
 * authLimiter — aplicar únicamente a POST /api/v1/auth/login.
 * Cuenta solo intentos fallidos (skipSuccessfulRequests: true).
 * 5 intentos fallidos por IP en 15 minutos → bloqueo automático.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos fallidos. Intenta nuevamente en 15 minutos.',
      details: null,
    },
  },
});

module.exports = { authLimiter };
