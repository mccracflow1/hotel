'use strict';

const db = require('../../config/database');
const repo = require('./cms.repository');
const { NotFoundError, ValidationError } = require('../../middlewares/error-handler');

function parseJsonIds(value) {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

async function hydrateGalleryValue(valueStr) {
  const ids = parseJsonIds(valueStr);
  if (!ids.length) return valueStr;
  const map = await repo.findMediaUrlsByIds(ids);
  const resolved = ids.map((id) => {
    const row = map.get(id);
    return row ? { id, url: row.original_url, thumbnail_url: row.thumbnail_url } : { id, url: null };
  });
  return JSON.stringify(resolved);
}

async function buildPublicSiteContentRows(rows) {
  const out = [];
  for (const row of rows) {
    let value = row.value;
    if (row.section === 'gallery' && row.key === 'images' && row.type === 'list_json') {
      // eslint-disable-next-line no-await-in-loop
      value = await hydrateGalleryValue(row.value);
    }
    out.push({
      section: row.section,
      key: row.key,
      value,
      type: row.type,
    });
  }
  return out;
}

async function getPublicBundle() {
  const siteRows = await repo.listAllSiteContent();
  const site_content = await buildPublicSiteContentRows(siteRows);
  const faqs = (await repo.listFaqsPublic()).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    sort_order: f.sort_order,
    is_active: f.is_active,
  }));
  return { site_content, faqs };
}

async function getSection(section) {
  const rows = await repo.listSiteContentSection(section);
  return rows.map((r) => ({
    section: r.section,
    key: r.key,
    value: r.value,
    type: r.type,
  }));
}

async function putSection(section, entries, userId) {
  if (!entries || !entries.length) {
    throw new ValidationError('entries must be a non-empty array');
  }
  await db.transaction((trx) => repo.replaceSectionContent(trx, section, entries, userId));
  return getSection(section);
}

async function listFaqsPublic() {
  return repo.listFaqsPublic();
}

async function listFaqsManage() {
  return repo.listFaqsManage();
}

async function createFaq(payload) {
  return db.transaction((trx) => repo.insertFaq(trx, payload));
}

async function patchFaq(id, payload) {
  return db.transaction(async (trx) => {
    const row = await repo.updateFaq(trx, id, payload);
    if (!row) throw new NotFoundError('FAQ not found');
    return row;
  });
}

async function removeFaq(id) {
  const n = await db.transaction((trx) => repo.deleteFaq(trx, id));
  if (!Number(n)) throw new NotFoundError('FAQ not found');
}

async function reorderFaqs(ids) {
  if (!ids || !ids.length) throw new ValidationError('ids required');
  await db.transaction((trx) => repo.reorderFaqs(trx, ids));
}

module.exports = {
  getPublicBundle,
  getSection,
  putSection,
  listFaqsPublic,
  listFaqsManage,
  createFaq,
  patchFaq,
  removeFaq,
  reorderFaqs,
};
