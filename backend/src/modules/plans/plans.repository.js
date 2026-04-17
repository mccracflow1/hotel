'use strict';

const db = require('../../config/database');

async function insertPlan(trx, payload) {
  const [row] = await trx('plans')
    .insert({
      name: payload.name,
      slug: payload.slug,
      short_desc: payload.short_desc ?? null,
      long_desc: payload.long_desc ?? null,
      base_price: payload.base_price,
      price_unit: payload.price_unit || 'per_group',
      max_persons: payload.max_persons,
      min_nights: payload.min_nights ?? 1,
      room_id: payload.room_id ?? null,
      is_active: payload.is_active !== false,
      sort_order: payload.sort_order ?? 0,
    })
    .returning('*');
  return row;
}

async function insertPlanActivities(trx, planId, activities) {
  if (!activities || !activities.length) return;
  const rows = activities.map((a, i) => ({
    plan_id: planId,
    name: a.name,
    description: a.description ?? null,
    extra_cost: a.extra_cost ?? 0,
    sort_order: a.sort_order != null ? a.sort_order : i,
  }));
  await trx('plan_activities').insert(rows);
}

async function findPlanById(trx, id, { includeDeleted = false } = {}) {
  let q = trx('plans').where({ id });
  if (!includeDeleted) q = q.whereNull('deleted_at');
  return q.first();
}

/** Active plan by URL slug (public marketing detail). */
async function findPlanBySlug(slug) {
  return db('plans').where({ slug: String(slug) }).whereNull('deleted_at').first();
}

async function listPlansPublic() {
  return db('plans')
    .whereNull('deleted_at')
    .where('is_active', true)
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc');
}

async function listPlansAdmin(query) {
  let q = db('plans');
  if (!query.include_deleted) q = q.whereNull('deleted_at');
  return q.orderBy('sort_order', 'asc').orderBy('name', 'asc');
}

async function getPlanDetail(id) {
  const plan = await db('plans').where({ id }).whereNull('deleted_at').first();
  if (!plan) return null;
  const baseActs = await db('plan_activities').where({ plan_id: id }).orderBy('sort_order', 'asc');
  const optionals = await db('plan_optional_activities as poa')
    .join('optional_activities as oa', 'oa.id', 'poa.optional_activity_id')
    .where('poa.plan_id', id)
    .select(
      'oa.id as optional_activity_id',
      'oa.name',
      'oa.price',
      'oa.price_unit',
      'oa.is_active',
      'poa.is_default'
    );
  optionals.sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });

  const media = await db('plan_media as pm')
    .join('media_library as ml', 'ml.id', 'pm.media_id')
    .where('pm.plan_id', id)
    .select(
      'ml.id',
      'ml.filename',
      'ml.original_url',
      'ml.thumbnail_url',
      'ml.file_type',
      'ml.mime_type',
      'pm.is_cover',
      'pm.sort_order'
    )
    .orderBy('pm.sort_order', 'asc');

  let room = null;
  if (plan.room_id) {
    room = await db('rooms')
      .where({ id: plan.room_id })
      .whereNull('deleted_at')
      .select('id', 'name', 'slug', 'description', 'capacity', 'base_price', 'type')
      .first();
  }

  return { plan, base_activities: baseActs, optional_activities: optionals, media, room };
}

async function updatePlanSortOrders(trx, planId, orderedIds) {
  let order = 0;
  for (const actId of orderedIds) {
    const n = await trx('plan_activities')
      .where({ id: actId, plan_id: planId })
      .update({ sort_order: order++ });
    if (n === 0) throw new Error('Invalid activity id for this plan');
  }
}

async function deletePlanActivity(trx, planId, activityId) {
  return trx('plan_activities').where({ id: activityId, plan_id: planId }).delete();
}

async function countDeleteImpact(planId, activityId) {
  const act = await db('plan_activities').where({ id: activityId, plan_id: planId }).first();
  if (!act) return { count: 0, plan_activity_id: activityId };
  const row = await db.raw(
    `
    SELECT COUNT(DISTINCT r.id)::int AS c
    FROM reservations r
    INNER JOIN reservation_activity_snapshot s ON s.reservation_id = r.id
    WHERE r.plan_id = ?
      AND r.status IN ('PENDING', 'CONFIRMED')
      AND r.date_start >= CURRENT_DATE
      AND s.activity_name = ?
      AND s.sort_order = ?
    `,
    [planId, act.name, act.sort_order]
  );
  const c = row.rows[0]?.c ?? 0;
  return { affected_future_reservation_count: c, plan_activity_id: activityId };
}

async function clonePlan(trx, sourcePlanId, newName, newSlug) {
  const src = await trx('plans').where({ id: sourcePlanId }).whereNull('deleted_at').first();
  if (!src) return null;
  const [newPlan] = await trx('plans')
    .insert({
      name: newName,
      slug: newSlug,
      short_desc: src.short_desc,
      long_desc: src.long_desc,
      base_price: src.base_price,
      price_unit: src.price_unit,
      max_persons: src.max_persons,
      min_nights: src.min_nights,
      room_id: src.room_id,
      is_active: true,
      sort_order: src.sort_order,
    })
    .returning('*');
  const acts = await trx('plan_activities').where({ plan_id: sourcePlanId }).orderBy('sort_order');
  for (const a of acts) {
    await trx('plan_activities').insert({
      plan_id: newPlan.id,
      name: a.name,
      description: a.description,
      extra_cost: a.extra_cost,
      sort_order: a.sort_order,
    });
  }
  return newPlan;
}

async function listOptionalActivitiesGlobal() {
  return db('optional_activities').orderBy('name', 'asc');
}

async function insertOptionalActivity(trx, payload) {
  const [row] = await trx('optional_activities')
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      price: payload.price,
      price_unit: payload.price_unit || 'per_person',
      duration_minutes: payload.duration_minutes ?? null,
      max_persons: payload.max_persons ?? null,
      media_id: payload.media_id ?? null,
      is_active: payload.is_active !== false,
    })
    .returning('*');
  return row;
}

async function updateOptionalActivity(trx, id, payload) {
  const allowed = [
    'name',
    'description',
    'price',
    'price_unit',
    'duration_minutes',
    'max_persons',
    'media_id',
    'is_active',
  ];
  const data = {};
  for (const k of allowed) {
    if (payload[k] !== undefined) data[k] = payload[k];
  }
  if (Object.keys(data).length === 0) return trx('optional_activities').where({ id }).first();
  const [row] = await trx('optional_activities').where({ id }).update(data).returning('*');
  return row;
}

async function linkOptionalToPlan(trx, planId, optionalId, isDefault) {
  await trx('plan_optional_activities')
    .insert({
      plan_id: planId,
      optional_activity_id: optionalId,
      is_default: !!isDefault,
    })
    .onConflict(['plan_id', 'optional_activity_id'])
    .merge({ is_default: !!isDefault });
}

async function unlinkOptionalFromPlan(trx, planId, optionalId) {
  return trx('plan_optional_activities').where({ plan_id: planId, optional_activity_id: optionalId }).delete();
}

async function linkPlanMedia(trx, planId, mediaId, { is_cover = false, sort_order = 0 } = {}) {
  await trx('plan_media')
    .insert({
      plan_id: planId,
      media_id: mediaId,
      is_cover: !!is_cover,
      sort_order: sort_order ?? 0,
    })
    .onConflict(['plan_id', 'media_id'])
    .merge({
      is_cover: !!is_cover,
      sort_order: sort_order ?? 0,
    });
}

async function unlinkPlanMedia(trx, planId, mediaId) {
  return trx('plan_media').where({ plan_id: planId, media_id: mediaId }).delete();
}

module.exports = {
  insertPlan,
  insertPlanActivities,
  findPlanById,
  findPlanBySlug,
  listPlansPublic,
  listPlansAdmin,
  getPlanDetail,
  updatePlanSortOrders,
  deletePlanActivity,
  countDeleteImpact,
  clonePlan,
  listOptionalActivitiesGlobal,
  insertOptionalActivity,
  updateOptionalActivity,
  linkOptionalToPlan,
  unlinkOptionalFromPlan,
  linkPlanMedia,
  unlinkPlanMedia,
};
