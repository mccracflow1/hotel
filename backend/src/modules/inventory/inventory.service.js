'use strict';

const db = require('../../config/database');
const { setAuditUserOnTrx } = require('../../utils/audit-context');
const repo = require('./inventory.repository');
const { ValidationError, NotFoundError, ConflictError } = require('../../middlewares/error-handler');

async function listItems(includeInactive) {
  const rows = await repo.listItems(db, { includeInactive });
  return { data: rows };
}

async function createItem(payload) {
  const row = await repo.createItem(db, payload);
  return { data: row };
}

async function updateItem(id, payload) {
  const existing = await repo.getItemById(db, id);
  if (!existing) throw new NotFoundError('Item not found');
  const row = await repo.updateItem(db, id, payload);
  return { data: row };
}

async function applyMovement(dto, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const item = await repo.lockItemForUpdate(trx, dto.item_id);
    if (!item) throw new NotFoundError('Item not found');
    if (!item.is_active) throw new ValidationError('Item is not active');

    let delta = Number(dto.quantity);
    if (dto.type === 'EXIT') delta = -Math.abs(delta);
    if (dto.type === 'ENTRY') delta = Math.abs(delta);
    if (dto.type === 'ADJUSTMENT') {
      delta = Number(dto.quantity);
    }

    const next = Number(item.current_stock) + delta;
    if (next < 0) {
      throw new ConflictError('Insufficient stock for this movement');
    }

    await trx('inventory_items').where({ id: item.id }).update({
      current_stock: next,
      updated_at: trx.fn.now(),
    });

    const [mov] = await trx('inventory_movements')
      .insert({
        item_id: item.id,
        type: dto.type,
        quantity: Math.abs(Number(dto.quantity)),
        notes: dto.notes || null,
        reservation_id: dto.reservation_id || null,
        created_by: userId,
      })
      .returning('*');

    return { data: mov };
  });
}

async function listAlerts() {
  const rows = await db('inventory_items')
    .where({ is_active: true })
    .whereRaw('current_stock < min_stock')
    .orderBy('name', 'asc');
  return { data: rows };
}

async function listMovements(itemId, query) {
  const existing = await repo.getItemById(db, itemId);
  if (!existing) throw new NotFoundError('Item not found');
  const rows = await repo.listMovementsForItem(db, itemId, query);
  return { data: rows };
}

module.exports = {
  listItems,
  createItem,
  updateItem,
  applyMovement,
  listAlerts,
  listMovements,
};
