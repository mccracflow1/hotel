'use strict';

const inventoryService = require('./inventory.service');
const {
  createItemSchema,
  updateItemSchema,
  movementSchema,
  listMovementsQuerySchema,
} = require('./inventory.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function listItems(req, res, next) {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const result = await inventoryService.listItems(includeInactive);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function createItem(req, res, next) {
  try {
    const body = validate(createItemSchema, req.body);
    const result = await inventoryService.createItem(body);
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function updateItem(req, res, next) {
  try {
    const body = validate(updateItemSchema, req.body);
    const result = await inventoryService.updateItem(req.params.id, body);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function postMovement(req, res, next) {
  try {
    const body = validate(movementSchema, req.body);
    const result = await inventoryService.applyMovement(body, req.user.id);
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function getAlerts(req, res, next) {
  try {
    const result = await inventoryService.listAlerts();
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function getMovements(req, res, next) {
  try {
    const q = validate(listMovementsQuerySchema, {
      ...req.query,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    const result = await inventoryService.listMovements(req.params.itemId, q);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  listItems,
  createItem,
  updateItem,
  postMovement,
  getAlerts,
  getMovements,
};
