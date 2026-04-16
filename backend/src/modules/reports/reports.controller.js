'use strict';

const reportsService = require('./reports.service');
const { dateRangeSchema } = require('./reports.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function occupancy(req, res, next) {
  try {
    const q = validate(dateRangeSchema, { ...req.query, granularity: req.query.granularity || 'day' });
    const result = await reportsService.occupancy(q);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function revenue(req, res, next) {
  try {
    const q = validate(dateRangeSchema, req.query);
    const result = await reportsService.revenue(q);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function reservations(req, res, next) {
  try {
    const q = validate(dateRangeSchema, req.query);
    const result = await reportsService.reservationsReport(q);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function inventory(req, res, next) {
  try {
    const q = validate(dateRangeSchema, req.query);
    const result = await reportsService.inventoryReport(q);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = { occupancy, revenue, reservations, inventory };
