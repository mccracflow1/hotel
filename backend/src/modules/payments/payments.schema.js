'use strict';

const Joi = require('joi');

const createPaymentBodySchema = Joi.object({
  reservation_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
});

module.exports = { createPaymentBodySchema };
