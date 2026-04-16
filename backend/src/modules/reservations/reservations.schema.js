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

const listReservationsQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
  date_from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  date_to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  room_id: Joi.string().uuid(),
  plan_id: Joi.string().uuid(),
  q: Joi.string().max(200).allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const patchStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
    .required(),
});

const updateDatesSchema = Joi.object({
  date_start: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  date_end: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null),
  version: Joi.number().integer().min(0),
});

const cancelBodySchema = Joi.object({
  cancellation_reason: Joi.string().max(200).required(),
});

const addOptionalSchema = Joi.object({
  optional_activity_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const reservationNumberParamSchema = Joi.object({
  reservationNumber: Joi.string()
    .pattern(/^HT-\d{4}-\d{5}$/)
    .required(),
});

module.exports = {
  createReservationSchema,
  listReservationsQuerySchema,
  patchStatusSchema,
  updateDatesSchema,
  cancelBodySchema,
  addOptionalSchema,
  reservationNumberParamSchema,
};
