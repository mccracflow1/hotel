'use strict';

const suppliersService = require('./suppliers.service');
const { supplierCreateSchema, supplierUpdateSchema } = require('./suppliers.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function list(req, res, next) {
  try {
    const result = await suppliersService.list();
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  try {
    const body = validate(supplierCreateSchema, req.body);
    const result = await suppliersService.create(body);
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function update(req, res, next) {
  try {
    const body = validate(supplierUpdateSchema, req.body);
    const result = await suppliersService.update(req.params.id, body);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, update };
