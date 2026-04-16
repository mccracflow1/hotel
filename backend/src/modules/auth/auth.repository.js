'use strict';

const db = require('../../config/database');

const authRepository = {
  async findByEmail(email) {
    return db('users').where({ email }).first();
  },

  async createRefreshToken(userId, tokenHash, expiresAt) {
    const [row] = await db('refresh_tokens')
      .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })
      .returning('*');
    return row;
  },

  async findRefreshToken(tokenHash) {
    return db('refresh_tokens as rt')
      .join('users as u', 'rt.user_id', 'u.id')
      .where('rt.token_hash', tokenHash)
      .select('rt.*', 'u.role', 'u.is_active', 'u.email', 'u.name')
      .first();
  },

  async deleteRefreshToken(tokenHash) {
    return db('refresh_tokens').where({ token_hash: tokenHash }).delete();
  },

  async deleteAllUserRefreshTokens(userId) {
    return db('refresh_tokens').where({ user_id: userId }).delete();
  },

  async updateLastLogin(userId) {
    return db('users').where({ id: userId }).update({ last_login_at: db.fn.now() });
  },

  async createPasswordResetToken(userId, tokenHash, expiresAt) {
    // Un usuario solo puede tener un token activo a la vez
    await db('password_reset_tokens').where({ user_id: userId }).delete();
    const [row] = await db('password_reset_tokens')
      .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })
      .returning('*');
    return row;
  },

  async findPasswordResetToken(tokenHash) {
    return db('password_reset_tokens as prt')
      .join('users as u', 'prt.user_id', 'u.id')
      .where('prt.token_hash', tokenHash)
      .where('prt.expires_at', '>', db.fn.now())
      .select('prt.*', 'u.id as user_id', 'u.email')
      .first();
  },

  async consumePasswordResetToken(tokenHash) {
    return db('password_reset_tokens').where({ token_hash: tokenHash }).delete();
  },

  async updatePassword(userId, passwordHash) {
    return db('users').where({ id: userId }).update({ password_hash: passwordHash, updated_at: db.fn.now() });
  },
};

module.exports = authRepository;
