'use strict';

const db = require('../../config/database');

async function insertMedia(trx, row) {
  const [r] = await trx('media_library').insert(row).returning('*');
  return r;
}

async function findById(id) {
  return db('media_library').where({ id }).first();
}

async function list({ q, file_type, page, limit }) {
  const offset = (page - 1) * limit;
  let query = db('media_library');
  if (q) query = query.whereILike('filename', `%${q}%`);
  if (file_type) query = query.where({ file_type });
  const countRow = await query.clone().count('* as c').first();
  const total = Number(countRow.c);
  const rows = await query.clone().select('*').orderBy('created_at', 'desc').offset(offset).limit(limit);
  return { rows, total };
}

async function deleteById(trx, id) {
  return trx('media_library').where({ id }).delete();
}

async function countRefs(trx, mediaId) {
  const m = String(mediaId);
  const [rm, pm, oa] = await Promise.all([
    trx('room_media').where({ media_id: m }).count('* as c').first(),
    trx('plan_media').where({ media_id: m }).count('* as c').first(),
    trx('optional_activities').where({ media_id: m }).count('* as c').first(),
  ]);
  let siteRefs = 0;
  const contentRows = await trx('site_content').where('type', 'list_json').select('value');
  for (const row of contentRows) {
    if (!row.value) continue;
    try {
      const arr = JSON.parse(row.value);
      if (Array.isArray(arr) && arr.includes(m)) siteRefs = 1;
    } catch {
      /* ignore */
    }
  }
  const n = (c) => Number(c.c);
  return n(rm) + n(pm) + n(oa) + siteRefs;
}

module.exports = { insertMedia, findById, list, deleteById, countRefs };
