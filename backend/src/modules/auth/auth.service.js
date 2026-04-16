'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const authRepository = require('./auth.repository');
const logger = require('../../utils/logger');
const { UnauthorizedError, AppError } = require('../../middlewares/error-handler');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'Strict',
  path: '/api/v1/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
};

function _hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function _generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

async function _sendResetEmail(email, rawToken) {
  if (!process.env.SMTP_HOST) {
    logger.logText('warn', 'SMTP not configured — password reset token logged to console', {
      email,
      resetToken: rawToken,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@hotel.com',
    to: email,
    subject: 'Restablece tu contraseña — Hotel Sofia',
    text: `Usa este token para restablecer tu contraseña (válido 1 hora): ${rawToken}`,
    html: `<p>Usa este token para restablecer tu contraseña (válido 1 hora):</p><code>${rawToken}</code>`,
  });
}

const authService = {
  async login(email, password, res) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError('INVALID_CREDENTIALS');
    if (!user.is_active) throw new UnauthorizedError('ACCOUNT_DISABLED');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedError('INVALID_CREDENTIALS');

    const accessToken = _generateAccessToken(user);
    const rawRefresh = uuidv4();
    const tokenHash = _hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken(user.id, tokenHash, expiresAt);
    await authRepository.updateLastLogin(user.id);

    res.cookie(REFRESH_COOKIE_NAME, rawRefresh, REFRESH_COOKIE_OPTIONS);

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      expiresIn: 900,
    };
  },

  async logout(cookieToken, res) {
    if (cookieToken) {
      const tokenHash = _hashToken(cookieToken);
      await authRepository.deleteRefreshToken(tokenHash);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_OPTIONS.path });
  },

  async refresh(cookieToken, res) {
    if (!cookieToken) throw new UnauthorizedError('INVALID_REFRESH_TOKEN');

    const tokenHash = _hashToken(cookieToken);
    const stored = await authRepository.findRefreshToken(tokenHash);

    if (!stored) {
      // Token no existe — puede ser reutilización: necesitamos el user_id del hash para invalidar
      // No podemos saberlo sin encontrar el token, así que solo rechazamos
      throw new UnauthorizedError('INVALID_REFRESH_TOKEN');
    }

    if (!stored.is_active) throw new UnauthorizedError('ACCOUNT_DISABLED');

    // Intentar borrar el token viejo — si DELETE afecta 0 filas fue usado concurrentemente
    const deleted = await authRepository.deleteRefreshToken(tokenHash);
    if (deleted === 0) {
      // Reutilización detectada — invalidar toda la sesión del usuario
      await authRepository.deleteAllUserRefreshTokens(stored.user_id);
      res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_OPTIONS.path });
      throw new UnauthorizedError('TOKEN_REUSE_DETECTED');
    }

    // Emitir nuevo par de tokens
    const user = { id: stored.user_id, email: stored.email, role: stored.role };
    const accessToken = _generateAccessToken(user);
    const rawRefresh = uuidv4();
    const newHash = _hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken(user.id, newHash, expiresAt);
    res.cookie(REFRESH_COOKIE_NAME, rawRefresh, REFRESH_COOKIE_OPTIONS);

    return { accessToken, expiresIn: 900 };
  },

  async forgotPassword(email) {
    const user = await authRepository.findByEmail(email);
    // No revelar si el email existe o no
    if (!user) return;

    const rawToken = uuidv4();
    const tokenHash = _hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await authRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    // Degradación elegante: si SMTP no está configurado, logea el token
    await _sendResetEmail(user.email, rawToken);
  },

  async resetPassword(tokenRaw, newPassword) {
    const tokenHash = _hashToken(tokenRaw);
    const record = await authRepository.findPasswordResetToken(tokenHash);

    if (!record) {
      throw new AppError('INVALID_RESET_TOKEN', 'Token de restablecimiento inválido o expirado', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await authRepository.updatePassword(record.user_id, passwordHash);
    await authRepository.consumePasswordResetToken(tokenHash);
  },

  async generateAgentToken() {
    // El token del agente IA tiene expiración de 1 año
    // Requiere que exista un usuario con role AGENT en la BD
    const agent = await require('../../config/database')('users')
      .where({ role: 'AGENT', is_active: true })
      .first();

    if (!agent) {
      throw new AppError('AGENT_NOT_FOUND', 'No existe un usuario con rol AGENT activo', 404);
    }

    return jwt.sign(
      { sub: agent.id, email: agent.email, role: 'AGENT' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1y' }
    );
  },
};

module.exports = authService;
