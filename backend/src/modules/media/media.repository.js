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

function valueReferencesMediaId(valueStr, mediaId) {
  if (!valueStr) return false;
  const m = String(mediaId);
  if (valueStr.includes(m)) return true;
  try {
    const arr = JSON.parse(valueStr);
    if (!Array.isArray(arr)) return false;
    return arr.some((item) => {
      if (typeof item === 'string') return item === m;
      if (item && typeof item === 'object' && item.id) return String(item.id) === m;
      return false;
    });
  } catch {
    return false;
  }
}

async function countRefs(trx, mediaId) {
  const usage = await listUsageDetails(trx, mediaId);
  return usage.total;
}

async function listUsageDetails(knex, mediaId) {
  const m = String(mediaId);
  const rooms = await knex('room_media')
    .where({ media_id: m })
    .join('rooms', 'room_media.room_id', 'rooms.id')
    .select('rooms.id', 'rooms.name');

  const plans = await knex('plan_media')
    .where({ media_id: m })
    .join('plans', 'plan_media.plan_id', 'plans.id')
    .select('plans.id', 'plans.name');

  const optionals = await knex('optional_activities')
    .where({ media_id: m })
    .select('id', 'name');

  const siteKeys = [];
  const contentRows = await knex('site_content').select('section', 'key', 'type', 'value');
  for (const row of contentRows) {
    if (row.type === 'list_json' && valueReferencesMediaId(row.value, m)) {
      siteKeys.push({ section: row.section, key: row.key });
    }
  }

  let businessLogo = false;
  const bc = await knex('business_config').select('logo_url').first();
  if (bc?.logo_url && String(bc.logo_url).includes(m)) businessLogo = true;

  const total = rooms.length + plans.length + optionals.length + siteKeys.length + (businessLogo ? 1 : 0);
  return { total, rooms, plans, optionals, site_content: siteKeys, business_logo: businessLogo };
}

async function patchFilename(trx, id, filename) {
  const updated = await trx('media_library').where({ id }).update({ filename }).returning('*');
  return Array.isArray(updated) ? updated[0] : updated;
}

module.exports = { insertMedia, findById, list, deleteById, countRefs, listUsageDetails, patchFilename };
