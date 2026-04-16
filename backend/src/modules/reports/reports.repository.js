'use strict';

const db = require('../../config/database');

const REVENUE_STATUSES = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED'];
const OCC_STATUSES = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED'];

/**
 * @param {{ from: string, to: string, granularity: 'day'|'week'|'month' }} q
 */
async function occupancyByPeriod(q) {
  const trunc =
    q.granularity === 'week' ? 'week' : q.granularity === 'month' ? 'month' : 'day';
  const periodSql =
    trunc === 'day' ? 'date_start::date' : `date_trunc('${trunc}', date_start)`;

  return db('reservations')
    .whereIn('status', OCC_STATUSES)
    .whereRaw('date_start::date <= ?::date', [q.to])
    .whereRaw('COALESCE(date_end, date_start)::date >= ?::date', [q.from])
    .select(db.raw(`${periodSql} as period`), db.raw('count(*)::int as cnt'))
    .groupByRaw(periodSql)
    .orderBy('period', 'asc');
}

async function revenueSum(q) {
  const row = await db('reservations')
    .whereIn('status', REVENUE_STATUSES)
    .whereRaw('date_start::date >= ?::date', [q.from])
    .whereRaw('date_start::date <= ?::date', [q.to])
    .sum({ total: 'total_amount' })
    .first();
  return { total_amount: Number(row?.total || 0) };
}

async function reservationsInRange(q) {
  return db('reservations')
    .whereRaw('date_start::date >= ?::date', [q.from])
    .whereRaw('date_start::date <= ?::date', [q.to])
    .orderBy('created_at', 'desc')
    .limit(500);
}

async function inventoryMovementsInWindow(q) {
  return db('inventory_movements as m')
    .join('inventory_items as i', 'm.item_id', 'i.id')
    .where('m.created_at', '>=', `${q.from}T00:00:00.000Z`)
    .where('m.created_at', '<=', `${q.to}T23:59:59.999Z`)
    .select(
      'm.id',
      'm.item_id',
      'i.name as item_name',
      'i.current_stock',
      'm.type',
      'm.quantity',
      'm.created_at',
      'm.reservation_id'
    )
    .orderBy('m.created_at', 'desc')
    .limit(2000);
}

/** Saldo actual por ítem que aparece en movimientos del periodo (referencia operativa). */
async function currentStockForItemIds(itemIds) {
  if (!itemIds.length) return [];
  return db('inventory_items')
    .whereIn('id', itemIds)
    .select('id as item_id', 'name', 'current_stock')
    .orderBy('name', 'asc');
}

module.exports = {
  occupancyByPeriod,
  revenueSum,
  reservationsInRange,
  inventoryMovementsInWindow,
  currentStockForItemIds,
  REVENUE_STATUSES,
  OCC_STATUSES,
};
