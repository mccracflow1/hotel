'use strict';

const Joi = require('joi');
const { createReservationSchema } = require('../reservations/reservations.schema');

const publicPaymentCreateSchema = Joi.object({
  reservation_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  payment_intent_token: Joi.string().min(32).max(512).required(),
});

module.exports = {
  createReservationSchema,
  publicPaymentCreateSchema,
};
