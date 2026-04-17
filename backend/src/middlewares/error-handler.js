const logger = require('../utils/logger');

class AppError extends Error {
  constructor(code, message, statusCode, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found') {
    super('NOT_FOUND', message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Missing or invalid authentication token') {
    super('UNAUTHORIZED', message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'User does not have the required RBAC role') {
    super('FORBIDDEN', message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super('CONFLICT', message, 409, details);
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Knex/Postgres constraint violations
  if (err.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists or constraint violation',
        details: null,
      },
    });
  }

  // Unexpected errors: log stack + PG diagnostics so 500s sean diagnosticables.
  logger.logText('error', 'Unhandled error', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    pgCode: err.code,
    pgDetail: err.detail,
    pgHint: err.hint,
    pgPosition: err.position,
    stack: err.stack,
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server error',
      details: null,
    },
  });
}

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
};
