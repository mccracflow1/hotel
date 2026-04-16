'use strict';

const Joi = require('joi');

const createReservationSchema = Joi.object({
  plan_id: Joi.string().uuid().allow(null),
  room_id: Joi.string().uuid().allow(null),
  customer_name: Joi.string().max(200).required(),
  customer_document: Joi.string().max(30).required(),
  customer_email: Joi.string().email().max(200).allow('', null),
  customer_phone: Joi.string().max(30).required(),
  date_start: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  date_end: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  adults: Joi.number().integer().min(1).required(),
  children: Joi.number().integer().min(0).default(0),
  notes: Joi.string().allow('', null),
  optional_activity_ids: Joi.array().items(Joi.string().uuid()).default([]),
});

module.exports = {
  createReservationSchema,
};
