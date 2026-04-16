'use strict';

const db = require('../../config/database');
const { setAuditUserOnTrx } = require('../../utils/audit-context');
const repo = require('./reservations.repository');
const { ValidationError, NotFoundError, ConflictError } = require('../../middlewares/error-handler');

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

module.exports = {
  createReservation,
};
