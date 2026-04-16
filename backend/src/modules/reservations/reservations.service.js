'use strict';

const db = require('../../config/database');
const { setAuditUserOnTrx } = require('../../utils/audit-context');
const repo = require('./reservations.repository');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} = require('../../middlewares/error-handler');

function nightsBetween(startStr, endStr) {
  const s = new Date(`${startStr}T12:00:00Z`);
  const e = endStr ? new Date(`${endStr}T12:00:00Z`) : s;
  const diff = Math.ceil((e - s) / (86400 * 1000));
  return Math.max(1, diff || 1);
}

async function buildCreatePayload(dto, userId) {
  const hasPlan = !!dto.plan_id;
  const hasRoom = !!dto.room_id;
  if (hasPlan === hasRoom) {
    throw new ValidationError('Exactly one of plan_id or room_id must be provided');
  }
  if (hasRoom && dto.optional_activity_ids && dto.optional_activity_ids.length > 0) {
    throw new ValidationError('optional_activity_ids apply only to plan reservations');
  }

  let roomId = hasRoom ? dto.room_id : null;
  let planId = hasPlan ? dto.plan_id : null;
  let totalAmount = 0;
  /** @type {{ activity_name: string, description: string|null, extra_cost: number, sort_order: number }[]} */
  let snapshotRows = [];
  /** @type {{ optional_activity_id: string|null, activity_name_snapshot: string, price_snapshot: number, quantity: number }[]} */
  let optionalRows = [];

  if (hasPlan) {
    const plan = await db('plans').where({ id: planId }).whereNull('deleted_at').first();
    if (!plan) throw new NotFoundError('Plan not found');
    if (!plan.is_active) throw new ValidationError('Plan is not active');

    const baseActs = await db('plan_activities').where({ plan_id: planId }).orderBy('sort_order');
    snapshotRows = baseActs.map((a) => ({
      activity_name: a.name,
      description: a.description,
      extra_cost: Number(a.extra_cost),
      sort_order: a.sort_order,
    }));

    totalAmount = Number(plan.base_price);
    for (const s of snapshotRows) {
      totalAmount += Number(s.extra_cost || 0);
    }

    const optIds = dto.optional_activity_ids || [];
    for (const oid of optIds) {
      const link = await db('plan_optional_activities')
        .where({ plan_id: planId, optional_activity_id: oid })
        .first();
      if (!link) throw new ValidationError(`Optional ${oid} is not linked to this plan`);
      const oa = await db('optional_activities').where({ id: oid }).first();
      if (!oa || !oa.is_active) throw new ValidationError(`Optional activity ${oid} not available`);
      totalAmount += Number(oa.price);
      optionalRows.push({
        optional_activity_id: oid,
        activity_name_snapshot: oa.name,
        price_snapshot: Number(oa.price),
        quantity: 1,
      });
    }
  } else {
    const room = await db('rooms').where({ id: roomId }).whereNull('deleted_at').first();
    if (!room) throw new NotFoundError('Room not found');
    if (!room.is_active) throw new ValidationError('Room is not active');
    const n = nightsBetween(dto.date_start, dto.date_end);
    totalAmount = Number(room.base_price) * n;
  }

  return {
    roomId,
    planId,
    dateStart: dto.date_start,
    dateEnd: dto.date_end || null,
    totalAmount: Math.round(totalAmount * 100) / 100,
    snapshotRows,
    optionalRows,
    createdBy: userId,
  };
}

async function createReservation(dto, userId) {
  const metaBase = await buildCreatePayload(dto, userId);

  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const reservationNumber = await repo.allocateReservationNumber(trx);
    try {
      const reservation = await repo.createReservationInTransaction(
        trx,
        dto,
        {
          ...metaBase,
          reservationNumber,
        }
      );
      return reservation;
    } catch (e) {
      if (e.code === 'NOT_AVAILABLE') {
        throw new ConflictError('No availability for the selected dates');
      }
      if (e.code === '23505') {
        throw new ConflictError('Reservation number collision — retry');
      }
      throw e;
    }
  });
}

function mapReservationRow(row) {
  if (!row) return row;
  return {
    ...row,
    total_amount: row.total_amount != null ? Number(row.total_amount) : row.total_amount,
  };
}

function mapDetail(detail) {
  if (!detail) return null;
  const base = mapReservationRow(detail);
  return {
    ...base,
    plan: detail.plan
      ? { id: detail.plan.id, name: detail.plan.name, slug: detail.plan.slug }
      : null,
    room: detail.room
      ? { id: detail.room.id, name: detail.room.name, slug: detail.room.slug }
      : null,
    activities_snapshot: (detail.activities_snapshot || []).map((a) => ({
      id: a.id,
      activity_name: a.activity_name,
      description: a.description,
      extra_cost: a.extra_cost != null ? Number(a.extra_cost) : 0,
      sort_order: a.sort_order,
    })),
    optional_activities: (detail.optional_activities || []).map((o) => ({
      id: o.id,
      optional_activity_id: o.optional_activity_id,
      activity_name_snapshot: o.activity_name_snapshot,
      price_snapshot: Number(o.price_snapshot),
      quantity: o.quantity,
    })),
  };
}

async function listReservations(filters, page, limit) {
  const total = await repo.countReservations(db, filters);
  const rows = await repo.listReservations(db, filters, page, limit);
  return {
    data: rows.map((r) => mapReservationRow(r)),
    meta: { page, limit, total },
  };
}

async function getReservationDetail(id) {
  const detail = await repo.loadReservationDetail(db, id);
  if (!detail) throw new NotFoundError('Reservation not found');
  return { data: mapDetail(detail) };
}

async function getReservationByNumber(reservationNumber) {
  const row = await repo.getReservationByNumber(db, reservationNumber);
  if (!row) throw new NotFoundError('Reservation not found');
  return getReservationDetail(row.id);
}

/**
 * Penalidad estimada según business_config.cancellation_policy (JSON array).
 */
async function getCancellationPolicyForReservation(reservationId) {
  const r = await repo.getReservationBase(db, reservationId);
  if (!r) throw new NotFoundError('Reservation not found');

  const cfg = await db('business_config').first();
  const policy = Array.isArray(cfg?.cancellation_policy) ? cfg.cancellation_policy : [];

  const checkinTime = cfg?.checkin_time || '15:00';
  const [hh, mm] = String(checkinTime).split(':').map((x) => parseInt(x, 10));
  const checkinAt = new Date(`${r.date_start}T${String(hh).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}:00`);

  const now = new Date();
  const hoursUntil = (checkinAt - now) / (3600 * 1000);

  const sorted = [...policy].sort((a, b) => (b.hours_before || 0) - (a.hours_before || 0));
  let penalty_pct = 0;
  let rule_matched = null;
  for (const rule of sorted) {
    const hb = Number(rule.hours_before);
    if (hoursUntil >= hb) {
      penalty_pct = Number(rule.penalty_pct ?? 0);
      rule_matched = rule;
      break;
    }
  }

  const total = Number(r.total_amount);
  const penalty_amount = Math.round(total * (penalty_pct / 100) * 100) / 100;

  return {
    data: {
      penalty_pct,
      penalty_amount,
      hours_before_checkin: Math.max(0, hoursUntil),
      rule_matched,
      reservation_id: r.id,
      total_amount: total,
    },
  };
}

const ADMIN_STATUS_TRANSITIONS = new Set([
  'PENDING->CONFIRMED',
  'PENDING->CANCELLED',
  'PAYMENT_PENDING->CONFIRMED',
  'PAYMENT_PENDING->CANCELLED',
  'CONFIRMED->COMPLETED',
  'CONFIRMED->CANCELLED',
]);

async function patchReservationStatus(id, newStatus, userId, userRole) {
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only ADMIN can manually change reservation status');
  }
  const r = await repo.getReservationBase(db, id);
  if (!r) throw new NotFoundError('Reservation not found');
  const key = `${r.status}->${newStatus}`;
  if (!ADMIN_STATUS_TRANSITIONS.has(key)) {
    throw new ValidationError(`Transition not allowed: ${key}`);
  }

  await db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    await trx('reservations')
      .where({ id })
      .update({
        status: newStatus,
        updated_at: trx.fn.now(),
        version: trx.raw('version + 1'),
      });
  });

  return getReservationDetail(id);
}

async function updateReservationDates(id, body, userId) {
  const { date_start, date_end, version } = body;
  const r = await repo.getReservationBase(db, id);
  if (!r) throw new NotFoundError('Reservation not found');
  if (['CANCELLED', 'COMPLETED'].includes(r.status)) {
    throw new ConflictError('Cannot modify dates for this reservation status');
  }
  if (version != null && Number(version) !== Number(r.version)) {
    throw new ConflictError('Reservation was modified — refresh and retry');
  }

  const end = date_end || null;
  const start = date_start;

  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const avail = await repo.checkAvailabilityRow(
      trx,
      r.room_id,
      r.plan_id,
      start,
      end || start,
      id
    );
    if (!avail) {
      throw new ConflictError('No availability for the selected dates');
    }
    await trx('reservations')
      .where({ id })
      .update({
        date_start: start,
        date_end: end,
        updated_at: trx.fn.now(),
        version: trx.raw('version + 1'),
      });
    return getReservationDetail(id);
  });
}

async function cancelReservation(id, cancellation_reason, userId) {
  const r = await repo.getReservationBase(db, id);
  if (!r) throw new NotFoundError('Reservation not found');
  if (r.status === 'CANCELLED') {
    return getReservationDetail(id);
  }
  if (['COMPLETED'].includes(r.status)) {
    throw new ConflictError('Cannot cancel a completed reservation');
  }

  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    await trx('reservations')
      .where({ id })
      .update({
        status: 'CANCELLED',
        cancellation_reason: cancellation_reason || 'Cancelled',
        updated_at: trx.fn.now(),
        version: trx.raw('version + 1'),
      });
    return getReservationDetail(id);
  });
}

async function addPostReservationOptionals(id, body, userId) {
  const { optional_activity_id, quantity } = body;
  const r = await repo.getReservationBase(db, id);
  if (!r) throw new NotFoundError('Reservation not found');
  if (!r.plan_id) {
    throw new ValidationError('Optional activities apply only to plan reservations');
  }
  if (['CANCELLED', 'COMPLETED'].includes(r.status)) {
    throw new ConflictError('Cannot add optionals to this reservation');
  }

  const link = await db('plan_optional_activities')
    .where({ plan_id: r.plan_id, optional_activity_id })
    .first();
  if (!link) {
    throw new ValidationError('Optional is not linked to this reservation plan');
  }
  const oa = await db('optional_activities').where({ id: optional_activity_id }).first();
  if (!oa || !oa.is_active) {
    throw new ValidationError('Optional activity not available');
  }

  const qty = quantity || 1;
  const lineTotal = Number(oa.price) * qty;

  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    await trx('reservation_optional_activities').insert({
      reservation_id: id,
      optional_activity_id,
      activity_name_snapshot: oa.name,
      price_snapshot: Number(oa.price),
      quantity: qty,
    });
    await trx('reservations')
      .where({ id })
      .update({
        total_amount: trx.raw('total_amount + ?', [lineTotal]),
        updated_at: trx.fn.now(),
        version: trx.raw('version + 1'),
      });
    return getReservationDetail(id);
  });
}

module.exports = {
  createReservation,
  listReservations,
  getReservationDetail,
  getReservationByNumber,
  getCancellationPolicyForReservation,
  patchReservationStatus,
  updateReservationDates,
  cancelReservation,
  addPostReservationOptionals,
};
