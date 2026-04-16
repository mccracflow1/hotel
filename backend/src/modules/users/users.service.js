'use strict';

const bcrypt = require('bcrypt');
const db = require('../../config/database');
const { NotFoundError, ForbiddenError, ValidationError, UnauthorizedError } = require('../../middlewares/error-handler');

const SALT = 12;

async function listUsers() {
  const rows = await db('users').select('id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at').orderBy('name');
  return { data: rows };
}

async function assertCanManageRole(actorRole, targetRole) {
  if (targetRole === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
    throw new ForbiddenError('ADMIN cannot manage SUPER_ADMIN');
  }
}

async function createUser(payload, actor) {
  await assertCanManageRole(actor.role, payload.role);
  const password_hash = await bcrypt.hash(payload.password, SALT);
  const [row] = await db('users')
    .insert({
      name: payload.name,
      email: payload.email,
      password_hash,
      role: payload.role,
      is_active: true,
    })
    .returning(['id', 'name', 'email', 'role', 'is_active', 'created_at']);
  return { data: row };
}

async function updateUser(id, payload, actor) {
  const existing = await db('users').where({ id }).first();
  if (!existing) throw new NotFoundError('User not found');
  await assertCanManageRole(actor.role, payload.role || existing.role);
  if (payload.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Cannot promote to SUPER_ADMIN');
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.is_active !== undefined) updates.is_active = payload.is_active;
  if (payload.password) {
    updates.password_hash = await bcrypt.hash(payload.password, SALT);
  }
  updates.updated_at = db.fn.now();

  const [row] = await db('users').where({ id }).update(updates).returning(['id', 'name', 'email', 'role', 'is_active', 'updated_at']);
  return { data: row };
}

async function patchMe(userId, body) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new NotFoundError('User not found');

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url || null;

  if (body.new_password) {
    const valid = await bcrypt.compare(body.current_password || '', user.password_hash);
    if (!valid) throw new UnauthorizedError('Invalid current password');
    updates.password_hash = await bcrypt.hash(body.new_password, SALT);
  }

  updates.updated_at = db.fn.now();
  const [row] = await db('users').where({ id: userId }).update(updates).returning(['id', 'name', 'email', 'role', 'avatar_url']);
  return { data: row };
}

async function getMe(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new NotFoundError('User not found');
  const { password_hash, ...rest } = user;
  return { data: rest };
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  patchMe,
  getMe,
};
