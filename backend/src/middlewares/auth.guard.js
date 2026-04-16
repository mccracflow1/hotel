'use strict';

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { UnauthorizedError, ForbiddenError } = require('./error-handler');

/**
 * authGuard — verifica el JWT y adjunta req.user al contexto.
 * Lanza UnauthorizedError si el token es inválido, expirado o el usuario está inactivo.
 */
async function authGuard(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or invalid Authorization header'));
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
      return next(new UnauthorizedError(msg));
    }

    const user = await db('users').where({ id: payload.sub, is_active: true }).first();
    if (!user) {
      return next(new UnauthorizedError('ACCOUNT_DISABLED'));
    }

    req.user = { id: user.id, email: user.email, role: user.role, is_active: user.is_active };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * requireRoles — factory que devuelve middleware de verificación de rol.
 * Siempre se aplica DESPUÉS de authGuard.
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('FORBIDDEN'));
    }
    return next();
  };
}

module.exports = { authGuard, requireRoles };
