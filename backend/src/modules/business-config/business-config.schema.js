'use strict';

const Joi = require('joi');

const policyRuleSchema = Joi.object({
  hours_before: Joi.number().min(0).required(),
  penalty_pct: Joi.number().min(0).max(100).required(),
});

const putBusinessConfigSchema = Joi.object({
  hotel_name: Joi.string().max(150),
  nit: Joi.string().max(30).allow('', null),
  address: Joi.string().allow('', null),
  checkin_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/),
  checkout_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/),
  cancellation_policy: Joi.array().items(policyRuleSchema),
  mp_public_key: Joi.string().allow('', null),
  mp_access_token: Joi.string().allow('', null),
  mp_webhook_secret: Joi.string().allow('', null),
  logo_url: Joi.string().uri().allow('', null),
  primary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
}).min(1);

module.exports = { putBusinessConfigSchema };
