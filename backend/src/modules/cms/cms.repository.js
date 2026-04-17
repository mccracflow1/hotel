'use strict';

const db = require('../../config/database');

async function listAllSiteContent() {
  return db('site_content').select('*').orderBy(['section', 'key']);
}

async function listSiteContentSection(section) {
  return db('site_content').where({ section }).orderBy('key', 'asc');
}

async function replaceSectionContent(trx, section, entries, userId) {
  const keys = entries.map((e) => e.key);
  if (keys.length) {
    await trx('site_content').where({ section }).whereNotIn('key', keys).delete();
  }
  for (const e of entries) {
    // eslint-disable-next-line no-await-in-loop
    await trx('site_content')
      .insert({
        section,
        key: e.key,
        value: e.value ?? null,
        type: e.type || 'text',
        updated_by: userId || null,
        updated_at: trx.fn.now(),
      })
      .onConflict(['section', 'key'])
      .merge({
        value: e.value ?? null,
        type: e.type || 'text',
        updated_by: userId || null,
        updated_at: trx.fn.now(),
      });
  }
}

async function listFaqsPublic() {
  return db('faqs').where({ is_active: true }).orderBy('sort_order', 'asc').orderBy('created_at', 'asc');
}

async function listFaqsManage() {
  return db('faqs').orderBy('sort_order', 'asc').orderBy('created_at', 'asc');
}

async function insertFaq(trx, payload) {
  const [row] = await trx('faqs')
    .insert({
      question: payload.question,
      answer: payload.answer,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active !== false,
    })
    .returning('*');
  return row;
}

async function updateFaq(trx, id, payload) {
  const data = { updated_at: trx.fn.now() };
  if (payload.question !== undefined) data.question = payload.question;
  if (payload.answer !== undefined) data.answer = payload.answer;
  if (payload.sort_order !== undefined) data.sort_order = payload.sort_order;
  if (payload.is_active !== undefined) data.is_active = payload.is_active;
  const updated = await trx('faqs').where({ id }).update(data).returning('*');
  return Array.isArray(updated) ? updated[0] : updated;
}

async function deleteFaq(trx, id) {
  return trx('faqs').where({ id }).delete();
}

async function reorderFaqs(trx, orderedIds) {
  let i = 0;
  for (const id of orderedIds) {
    // eslint-disable-next-line no-await-in-loop
    await trx('faqs').where({ id }).update({ sort_order: i++, updated_at: trx.fn.now() });
  }
}

async function findMediaUrlsByIds(ids) {
  if (!ids.length) return new Map();
  const rows = await db('media_library').whereIn('id', ids).select('id', 'original_url', 'thumbnail_url');
  const m = new Map();
  for (const r of rows) m.set(String(r.id), r);
  return m;
}

module.exports = {
  listAllSiteContent,
  listSiteContentSection,
  replaceSectionContent,
  listFaqsPublic,
  listFaqsManage,
  insertFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  findMediaUrlsByIds,
};
