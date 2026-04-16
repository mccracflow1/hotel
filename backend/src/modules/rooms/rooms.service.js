'use strict';

const crypto = require('crypto');
const db = require('../../config/database');
const { toSlug } = require('../../utils/slug');
const { setAuditUserOnTrx } = require('../../utils/audit-context');
const roomsRepo = require('./rooms.repository');
const { NotFoundError, ConflictError } = require('../../middlewares/error-handler');

async function ensureUniqueSlug(trx, baseSlug, excludeId = null) {
  let slug = baseSlug;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = trx('rooms').where({ slug });
    if (excludeId) q = q.whereNot({ id: excludeId });
    const exists = await q.first();
    if (!exists) return slug;
    attempt += 1;
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
    if (attempt > 50) throw new ConflictError('Could not allocate unique slug');
  }
}

async function createRoom(payload, userId) {
  const base = payload.slug ? toSlug(payload.slug) : toSlug(payload.name);
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const slug = await ensureUniqueSlug(trx, base);
    const row = await roomsRepo.insertRoom(trx, { ...payload, slug });
    if (payload.media_ids && payload.media_ids.length) {
      await roomsRepo.setRoomMedia(trx, row.id, payload.media_ids, payload.cover_media_id);
    }
    return roomsRepo.hydrateMedia(row);
  });
}

async function updateRoom(id, payload, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const existing = await trx('rooms').where({ id }).whereNull('deleted_at').first();
    if (!existing) throw new NotFoundError('Room not found');
    let nextPayload = { ...payload };
    if (payload.slug || payload.name) {
      const base = payload.slug ? toSlug(payload.slug) : existing.slug;
      nextPayload.slug = await ensureUniqueSlug(trx, base, id);
    }
    const row = await roomsRepo.updateRoom(trx, id, nextPayload);
    if (!row) throw new NotFoundError('Room not found');
    if (payload.media_ids) {
      await roomsRepo.setRoomMedia(trx, id, payload.media_ids, payload.cover_media_id);
    }
    return roomsRepo.hydrateMedia(row);
  });
}

async function removeRoom(id, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const row = await roomsRepo.softDelete(trx, id);
    if (!row) throw new NotFoundError('Room not found');
    return row;
  });
}

module.exports = {
  createRoom,
  updateRoom,
  removeRoom,
  listPublic: () => roomsRepo.listPublic(),
  listAdmin: (q) => roomsRepo.listAdmin(q),
  getById: (id, opts) => roomsRepo.findById(id, opts),
};
