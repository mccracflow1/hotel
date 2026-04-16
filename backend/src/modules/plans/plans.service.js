'use strict';

const crypto = require('crypto');
const db = require('../../config/database');
const { toSlug } = require('../../utils/slug');
const { setAuditUserOnTrx } = require('../../utils/audit-context');
const repo = require('./plans.repository');
const { NotFoundError, ConflictError } = require('../../middlewares/error-handler');

async function ensureUniquePlanSlug(trx, baseSlug, excludeId = null) {
  let slug = baseSlug;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = trx('plans').where({ slug });
    if (excludeId) q = q.whereNot({ id: excludeId });
    const exists = await q.first();
    if (!exists) return slug;
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
    attempt += 1;
    if (attempt > 50) throw new ConflictError('Could not allocate unique slug');
  }
}

function mapPlanRow(p) {
  if (!p) return p;
  return {
    ...p,
    base_price: p.base_price != null ? Number(p.base_price) : p.base_price,
  };
}

async function createPlan(payload, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const base = payload.slug ? toSlug(payload.slug) : toSlug(payload.name);
    const slug = await ensureUniquePlanSlug(trx, base);
    const plan = await repo.insertPlan(trx, { ...payload, slug });
    await repo.insertPlanActivities(trx, plan.id, payload.base_activities || []);
    return mapPlanRow(plan);
  });
}

async function updatePlan(id, payload, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const existing = await repo.findPlanById(trx, id);
    if (!existing) throw new NotFoundError('Plan not found');
    const data = { ...payload, updated_at: trx.fn.now() };
    if (payload.slug || payload.name) {
      const base = payload.slug ? toSlug(payload.slug) : existing.slug;
      data.slug = await ensureUniquePlanSlug(trx, base, id);
    }
    const [row] = await trx('plans').where({ id }).whereNull('deleted_at').update(data).returning('*');
    if (!row) throw new NotFoundError('Plan not found');
    return mapPlanRow(row);
  });
}

async function reorderActivities(planId, orderedIds, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const p = await repo.findPlanById(trx, planId);
    if (!p) throw new NotFoundError('Plan not found');
    await repo.updatePlanSortOrders(trx, planId, orderedIds);
    return { ok: true };
  });
}

async function getDeleteImpact(planId, activityId) {
  return repo.countDeleteImpact(planId, activityId);
}

async function removePlanActivity(planId, activityId, confirmHeader, userId) {
  if (String(confirmHeader) !== 'true') {
    const { ValidationError } = require('../../middlewares/error-handler');
    throw new ValidationError('X-Confirm-Impact header must be "true" after reviewing impact');
  }
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const p = await repo.findPlanById(trx, planId);
    if (!p) throw new NotFoundError('Plan not found');
    const n = await repo.deletePlanActivity(trx, planId, activityId);
    if (!n) throw new NotFoundError('Plan activity not found');
    return { deleted: true };
  });
}

async function duplicatePlan(sourcePlanId, newName, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const base = toSlug(newName);
    const slug = await ensureUniquePlanSlug(trx, base);
    const plan = await repo.clonePlan(trx, sourcePlanId, newName, slug);
    if (!plan) throw new NotFoundError('Plan not found');
    return mapPlanRow(plan);
  });
}

async function createOptionalGlobal(payload, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    return repo.insertOptionalActivity(trx, payload);
  });
}

async function updateOptionalGlobal(id, payload, userId) {
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const row = await repo.updateOptionalActivity(trx, id, payload);
    if (!row) throw new NotFoundError('Optional activity not found');
    return row;
  });
}

module.exports = {
  createPlan,
  updatePlan,
  reorderActivities,
  getDeleteImpact,
  removePlanActivity,
  duplicatePlan,
  createOptionalGlobal,
  updateOptionalGlobal,
  listPublic: () => repo.listPlansPublic().then((rows) => rows.map(mapPlanRow)),
  listAdmin: (q) => repo.listPlansAdmin(q).then((rows) => rows.map(mapPlanRow)),
  getDetail: async (id) => {
    const d = await repo.getPlanDetail(id);
    if (!d) return null;
    return {
      ...mapPlanRow(d.plan),
      base_activities: d.base_activities,
      optional_activities: d.optional_activities.map((o) => ({
        ...o,
        price: Number(o.price),
      })),
    };
  },
  linkOptional: (planId, body, userId) =>
    db.transaction(async (trx) => {
      await setAuditUserOnTrx(trx, userId);
      await repo.linkOptionalToPlan(trx, planId, body.optional_activity_id, body.is_default);
      return { ok: true };
    }),
  unlinkOptional: (planId, optionalId, userId) =>
    db.transaction(async (trx) => {
      await setAuditUserOnTrx(trx, userId);
      await repo.unlinkOptionalFromPlan(trx, planId, optionalId);
      return { ok: true };
    }),
  listOptionalCatalog: () => repo.listOptionalActivitiesGlobal(),
};
