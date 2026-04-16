'use strict';

const db = require('../../config/database');

function baseRoomSelect() {
  return db('rooms as r')
    .select(
      'r.id',
      'r.name',
      'r.slug',
      'r.type',
      'r.description',
      'r.short_desc',
      'r.capacity',
      'r.base_price',
      'r.amenities',
      'r.is_active',
      'r.sort_order',
      'r.deleted_at',
      'r.created_at',
      'r.updated_at'
    );
}

async function findById(id, { includeDeleted = false } = {}) {
  let q = baseRoomSelect().where('r.id', id);
  if (!includeDeleted) q = q.whereNull('r.deleted_at');
  return q.first();
}

async function findBySlug(slug) {
  return baseRoomSelect().where('r.slug', slug).whereNull('r.deleted_at').first();
}

async function listPublic() {
  const rows = await baseRoomSelect()
    .whereNull('r.deleted_at')
    .where('r.is_active', true)
    .orderBy('r.sort_order', 'asc')
    .orderBy('r.name', 'asc')
    .select(
      db.raw(`(
        SELECT ml.original_url FROM room_media rm
        INNER JOIN media_library ml ON ml.id = rm.media_id
        WHERE rm.room_id = r.id AND rm.is_cover = true
        LIMIT 1
      ) as cover_media_url`)
    );

  return rows.map(mapRoomRow);
}

async function listAdmin(query) {
  let q = baseRoomSelect();
  if (!query.include_deleted) {
    q = q.whereNull('r.deleted_at');
  }
  const rows = await q.orderBy('r.sort_order', 'asc').orderBy('r.name', 'asc');
  return Promise.all(rows.map((row) => hydrateMedia(row)));
}

function mapRoomRow(row) {
  const { cover_media_url, ...rest } = row;
  return {
    ...rest,
    base_price: rest.base_price != null ? Number(rest.base_price) : rest.base_price,
    cover_media_url: cover_media_url || null,
  };
}

async function hydrateMedia(row) {
  const cover = await db('room_media as rm')
    .join('media_library as ml', 'ml.id', 'rm.media_id')
    .where('rm.room_id', row.id)
    .where('rm.is_cover', true)
    .select('ml.original_url')
    .first();
  return mapRoomRow({ ...row, cover_media_url: cover?.original_url });
}

async function insertRoom(trx, payload) {
  const [row] = await trx('rooms')
    .insert({
      name: payload.name,
      slug: payload.slug,
      type: payload.type,
      description: payload.description ?? null,
      short_desc: payload.short_desc ?? null,
      capacity: payload.capacity,
      base_price: payload.base_price,
      amenities: payload.amenities || [],
      is_active: payload.is_active !== false,
      sort_order: payload.sort_order ?? 0,
    })
    .returning('*');
  return row;
}

async function updateRoom(trx, id, payload) {
  const data = { updated_at: trx.fn.now() };
  const fields = [
    'name',
    'slug',
    'type',
    'description',
    'short_desc',
    'capacity',
    'base_price',
    'amenities',
    'is_active',
    'sort_order',
  ];
  for (const f of fields) {
    if (payload[f] !== undefined) {
      if (f === 'amenities') data[f] = payload[f];
      else data[f] = payload[f];
    }
  }
  const [row] = await trx('rooms').where({ id }).whereNull('deleted_at').update(data).returning('*');
  return row;
}

async function softDelete(trx, id) {
  const [row] = await trx('rooms')
    .where({ id })
    .whereNull('deleted_at')
    .update({ deleted_at: trx.fn.now(), updated_at: trx.fn.now() })
    .returning('*');
  return row;
}

async function setRoomMedia(trx, roomId, mediaIds, coverMediaId) {
  await trx('room_media').where({ room_id: roomId }).delete();
  if (!mediaIds || mediaIds.length === 0) return;
  let sort = 0;
  for (const mediaId of mediaIds) {
    const exists = await trx('media_library').where({ id: mediaId }).first();
    if (!exists) continue;
    const isCover = coverMediaId ? mediaId === coverMediaId : sort === 0;
    await trx('room_media').insert({
      room_id: roomId,
      media_id: mediaId,
      is_cover: isCover,
      sort_order: sort++,
    });
  }
  if (coverMediaId && mediaIds.includes(coverMediaId)) {
    await trx('room_media').where({ room_id: roomId }).update({ is_cover: false });
    await trx('room_media').where({ room_id: roomId, media_id: coverMediaId }).update({ is_cover: true });
  }
}

module.exports = {
  findById,
  findBySlug,
  listPublic,
  listAdmin,
  insertRoom,
  updateRoom,
  softDelete,
  setRoomMedia,
  hydrateMedia,
  mapRoomRow,
};
