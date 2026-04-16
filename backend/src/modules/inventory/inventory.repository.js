'use strict';

async function listItems(db, { includeInactive } = {}) {
  let q = db('inventory_items').orderBy('name', 'asc');
  if (!includeInactive) q = q.where({ is_active: true });
  return q;
}

async function getItemById(db, id) {
  return db('inventory_items').where({ id }).first();
}

async function createItem(db, row) {
  const [r] = await db('inventory_items').insert(row).returning('*');
  return r;
}

async function updateItem(db, id, row) {
  const [r] = await db('inventory_items').where({ id }).update({ ...row, updated_at: db.fn.now() }).returning('*');
  return r;
}

async function listMovementsForItem(db, itemId, filters) {
  let q = db('inventory_movements').where({ item_id: itemId }).orderBy('created_at', 'desc');
  if (filters.type) q = q.andWhere({ type: filters.type });
  if (filters.date_from) q = q.andWhere('created_at', '>=', `${filters.date_from}T00:00:00.000Z`);
  if (filters.date_to) q = q.andWhere('created_at', '<=', `${filters.date_to}T23:59:59.999Z`);
  const limit = filters.limit || 50;
  const offset = ((filters.page || 1) - 1) * limit;
  return q.limit(limit).offset(offset);
}

async function insertMovement(db, row) {
  const [r] = await db('inventory_movements').insert(row).returning('*');
  return r;
}

async function lockItemForUpdate(trx, itemId) {
  return trx('inventory_items').where({ id: itemId }).forUpdate().first();
}

module.exports = {
  listItems,
  getItemById,
  createItem,
  updateItem,
  listMovementsForItem,
  insertMovement,
  lockItemForUpdate,
};
