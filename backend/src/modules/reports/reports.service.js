'use strict';

const repo = require('./reports.repository');
const { ValidationError } = require('../../middlewares/error-handler');

function parseRange(q) {
  if (q.from > q.to) throw new ValidationError('from must be <= to');
  return q;
}

async function occupancy(q) {
  const p = parseRange(q);
  const rows = await repo.occupancyByPeriod(p);
  return {
    data: rows,
    meta: {
      from: p.from,
      to: p.to,
      granularity: p.granularity,
      statuses_included: repo.OCC_STATUSES,
    },
  };
}

async function revenue(q) {
  const p = parseRange(q);
  const data = await repo.revenueSum(p);
  return {
    data,
    meta: {
      from: p.from,
      to: p.to,
      revenue_basis: 'reservation_totals',
      statuses_included: repo.REVENUE_STATUSES,
      note: 'Preliminar — no refleja cobros MercadoPago confirmados hasta Fase 2',
    },
  };
}

async function reservationsReport(q) {
  const p = parseRange(q);
  const rows = await repo.reservationsInRange(p);
  return {
    data: rows,
    meta: { from: p.from, to: p.to, limit: 500 },
  };
}

async function inventoryReport(q) {
  const p = parseRange(q);
  const rows = await repo.inventoryMovementsInWindow(p);
  const ids = [...new Set(rows.map((r) => r.item_id))];
  const balances = await repo.currentStockForItemIds(ids);
  return {
    data: rows,
    meta: {
      from: p.from,
      to: p.to,
      balances,
      note: 'current_stock es el saldo actual del ítem (no histórico al cierre del periodo)',
    },
  };
}

module.exports = {
  occupancy,
  revenue,
  reservationsReport,
  inventoryReport,
};
