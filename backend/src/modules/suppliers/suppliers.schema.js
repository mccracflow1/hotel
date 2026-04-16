'use strict';

const Joi = require('joi');

const supplierCreateSchema = Joi.object({
  name: Joi.string().max(120).required(),
  phone: Joi.string().max(30).allow('', null),
  email: Joi.string().email().max(200).allow('', null),
  address: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  is_active: Joi.boolean().default(true),
});

const supplierUpdateSchema = supplierCreateSchema.fork(['name'], (s) => s.optional()).min(1);

module.exports = { supplierCreateSchema, supplierUpdateSchema };
