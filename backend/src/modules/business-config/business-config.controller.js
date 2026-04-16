'use strict';

const businessConfigService = require('./business-config.service');
const { putBusinessConfigSchema } = require('./business-config.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function getConfig(req, res, next) {
  try {
    const result = await businessConfigService.getConfig(req.user.role);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function putConfig(req, res, next) {
  try {
    const body = validate(putBusinessConfigSchema, req.body);
    const result = await businessConfigService.updateConfig(body, req.user);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = { getConfig, putConfig };
