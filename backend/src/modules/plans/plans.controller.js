'use strict';

const db = require('../../config/database');
const plansRepo = require('./plans.repository');
const plansService = require('./plans.service');
const {
  createPlanSchema,
  patchPlanSchema,
  reorderActivitiesSchema,
  linkOptionalSchema,
  linkPlanMediaSchema,
} = require('./plans.schema');
const { ValidationError, ForbiddenError, NotFoundError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

function canManagePlans(user) {
  return user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
}

async function listPlans(req, res, next) {
  try {
    const includeDeleted =
      req.query.include_deleted === 'true' || req.query.include_deleted === '1';
    if (canManagePlans(req.user)) {
      const data = await plansService.listAdmin({ include_deleted: includeDeleted });
      return res.status(200).json({ data });
    }
    const data = await plansService.listPublic();
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function getPlan(req, res, next) {
  try {
    const data = await plansService.getDetail(req.params.id);
    if (!data) return next(new NotFoundError('Plan not found'));
    if (!data.is_active && !canManagePlans(req.user)) {
      return next(new NotFoundError('Plan not found'));
    }
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function getPlanBySlug(req, res, next) {
  try {
    const data = await plansService.getDetailBySlug(req.params.slug);
    if (!data) return next(new NotFoundError('Plan not found'));
    if (!data.is_active && !canManagePlans(req.user)) {
      return next(new NotFoundError('Plan not found'));
    }
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function createPlan(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(createPlanSchema, req.body);
    const data = await plansService.createPlan(body, req.user.id);
    return res.status(201).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function patchPlan(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(patchPlanSchema, req.body);
    const data = await plansService.updatePlan(req.params.id, body, req.user.id);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function postReorder(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(reorderActivitiesSchema, req.body);
    await plansService.reorderActivities(req.params.id, body.ordered_activity_ids, req.user.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function getDeleteImpact(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const data = await plansService.getDeleteImpact(req.params.id, req.params.activityId);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function deleteActivity(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const header = req.headers['x-confirm-impact'];
    await plansService.removePlanActivity(req.params.id, req.params.activityId, header, req.user.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function postClone(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const name = req.body?.name;
    if (!name || typeof name !== 'string') {
      throw new ValidationError('name is required');
    }
    const data = await plansService.duplicatePlan(req.params.id, name, req.user.id);
    return res.status(201).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function postLinkOptional(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(linkOptionalSchema, req.body);
    await plansService.linkOptional(req.params.id, body, req.user.id);
    return res.status(201).json({ data: { linked: true } });
  } catch (err) {
    return next(err);
  }
}

async function deleteLinkOptional(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    await plansService.unlinkOptional(req.params.id, req.params.optionalId, req.user.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function postPlanMedia(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(linkPlanMediaSchema, req.body);
    await db.transaction(async (trx) => {
      const plan = await trx('plans').where({ id: req.params.id }).whereNull('deleted_at').first();
      if (!plan) throw new NotFoundError('Plan not found');
      const m = await trx('media_library').where({ id: body.media_id }).first();
      if (!m) throw new NotFoundError('Media not found');
      await plansRepo.linkPlanMedia(trx, req.params.id, body.media_id, {
        is_cover: body.is_cover,
        sort_order: body.sort_order,
      });
    });
    return res.status(201).json({ data: { plan_id: req.params.id, media_id: body.media_id } });
  } catch (err) {
    return next(err);
  }
}

async function deletePlanMedia(req, res, next) {
  try {
    if (!canManagePlans(req.user)) throw new ForbiddenError('FORBIDDEN');
    const n = await db.transaction((trx) =>
      plansRepo.unlinkPlanMedia(trx, req.params.id, req.params.mediaId)
    );
    if (!n) return next(new NotFoundError('Association not found'));
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listPlans,
  getPlan,
  getPlanBySlug,
  createPlan,
  patchPlan,
  postReorder,
  getDeleteImpact,
  deleteActivity,
  postClone,
  postLinkOptional,
  deleteLinkOptional,
  postPlanMedia,
  deletePlanMedia,
};
