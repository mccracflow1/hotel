'use strict';

const plansService = require('./plans.service');
const {
  createOptionalActivitySchema,
  patchOptionalActivitySchema,
} = require('./plans.schema');
const { ValidationError, ForbiddenError, NotFoundError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

function canManage(user) {
  return user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
}

async function listOptional(req, res, next) {
  try {
    const rows = await plansService.listOptionalCatalog();
    const data = rows.map((r) => ({
      ...r,
      price: r.price != null ? Number(r.price) : r.price,
    }));
    if (!canManage(req.user)) {
      return res.status(200).json({ data: data.filter((x) => x.is_active) });
    }
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function createOptional(req, res, next) {
  try {
    if (!canManage(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(createOptionalActivitySchema, req.body);
    const data = await plansService.createOptionalGlobal(body, req.user.id);
    return res.status(201).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function patchOptional(req, res, next) {
  try {
    if (!canManage(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(patchOptionalActivitySchema, req.body);
    const data = await plansService.updateOptionalGlobal(req.params.id, body, req.user.id);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function deleteOptional(req, res, next) {
  try {
    if (!canManage(req.user)) throw new ForbiddenError('FORBIDDEN');
    const data = await plansService.updateOptionalGlobal(
      req.params.id,
      { is_active: false },
      req.user.id
    );
    if (!data) return next(new NotFoundError('Optional activity not found'));
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listOptional,
  createOptional,
  patchOptional,
  deleteOptional,
};
