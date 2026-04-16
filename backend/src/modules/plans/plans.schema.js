'use strict';

const Joi = require('joi');

const PRICE_UNITS = ['per_person', 'per_group', 'per_night', 'per_session'];

const createPlanSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().max(100).optional(),
  short_desc: Joi.string().max(300).allow('', null).optional(),
  long_desc: Joi.string().allow('', null).optional(),
  base_price: Joi.number().precision(2).min(0).required(),
  price_unit: Joi.string()
    .valid(...PRICE_UNITS)
    .default('per_group'),
  max_persons: Joi.number().integer().min(1).max(32767).required(),
  min_nights: Joi.number().integer().min(1).default(1),
  room_id: Joi.string().uuid().allow(null).optional(),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().min(0).default(0),
  base_activities: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(150).required(),
        description: Joi.string().allow('', null).optional(),
        extra_cost: Joi.number().precision(2).min(0).default(0),
        sort_order: Joi.number().integer().min(0).default(0),
      })
    )
    .optional(),
});

const patchPlanSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  slug: Joi.string().max(100).optional(),
  short_desc: Joi.string().max(300).allow('', null).optional(),
  long_desc: Joi.string().allow('', null).optional(),
  base_price: Joi.number().precision(2).min(0).optional(),
  price_unit: Joi.string()
    .valid(...PRICE_UNITS)
    .optional(),
  max_persons: Joi.number().integer().min(1).optional(),
  min_nights: Joi.number().integer().min(1).optional(),
  room_id: Joi.string().uuid().allow(null).optional(),
  is_active: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional(),
}).min(1);

const reorderActivitiesSchema = Joi.object({
  ordered_activity_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const linkOptionalSchema = Joi.object({
  optional_activity_id: Joi.string().uuid().required(),
  is_default: Joi.boolean().default(false),
});

const createOptionalActivitySchema = Joi.object({
  name: Joi.string().max(150).required(),
  description: Joi.string().allow('', null).optional(),
  price: Joi.number().precision(2).min(0).required(),
  price_unit: Joi.string()
    .valid(...PRICE_UNITS)
    .default('per_person'),
  duration_minutes: Joi.number().integer().min(0).allow(null).optional(),
  max_persons: Joi.number().integer().min(0).allow(null).optional(),
  media_id: Joi.string().uuid().allow(null).optional(),
  is_active: Joi.boolean().default(true),
});

const patchOptionalActivitySchema = Joi.object({
  name: Joi.string().max(150).optional(),
  description: Joi.string().allow('', null).optional(),
  price: Joi.number().precision(2).min(0).optional(),
  price_unit: Joi.string()
    .valid(...PRICE_UNITS)
    .optional(),
  duration_minutes: Joi.number().integer().min(0).allow(null).optional(),
  max_persons: Joi.number().integer().min(0).allow(null).optional(),
  media_id: Joi.string().uuid().allow(null).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createPlanSchema,
  patchPlanSchema,
  reorderActivitiesSchema,
  linkOptionalSchema,
  createOptionalActivitySchema,
  patchOptionalActivitySchema,
  PRICE_UNITS,
};
