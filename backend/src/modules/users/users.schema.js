'use strict';

const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().max(120).required(),
  email: Joi.string().email().max(200).required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT').required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().max(120),
  email: Joi.string().email().max(200),
  password: Joi.string().min(8).max(128).allow('', null),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT'),
  is_active: Joi.boolean(),
}).min(1);

const patchMeSchema = Joi.object({
  name: Joi.string().max(120),
  avatar_url: Joi.string().uri().max(500).allow('', null),
  current_password: Joi.string().allow('', null),
  new_password: Joi.string().min(8).max(128).allow('', null),
})
  .min(1)
  .with('new_password', 'current_password');

const patchUserStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

module.exports = { createUserSchema, updateUserSchema, patchMeSchema, patchUserStatusSchema };
