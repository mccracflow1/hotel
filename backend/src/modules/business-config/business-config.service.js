'use strict';

const db = require('../../config/database');
const { NotFoundError, ForbiddenError } = require('../../middlewares/error-handler');

function maskRow(row, role) {
  if (!row) return null;
  const copy = { ...row };
  if (role !== 'SUPER_ADMIN') {
    if (copy.mp_access_token) copy.mp_access_token = '***';
    if (copy.mp_webhook_secret) copy.mp_webhook_secret = '***';
  }
  return copy;
}

async function getConfig(userRole) {
  let row = await db('business_config').first();
  if (!row) {
    return { data: null };
  }
  return { data: maskRow(row, userRole) };
}

async function updateConfig(payload, actor) {
  const existing = await db('business_config').first();
  if (!existing) throw new NotFoundError('business_config not initialized');

  const updates = { ...payload, updated_at: db.fn.now() };

  if (actor.role !== 'SUPER_ADMIN') {
    delete updates.mp_access_token;
    delete updates.mp_webhook_secret;
    if (payload.mp_access_token !== undefined || payload.mp_webhook_secret !== undefined) {
      throw new ForbiddenError('Only SUPER_ADMIN can update payment secrets');
    }
  }

  const [row] = await db('business_config').where({ id: existing.id }).update(updates).returning('*');
  return { data: maskRow(row, actor.role) };
}

module.exports = { getConfig, updateConfig };
