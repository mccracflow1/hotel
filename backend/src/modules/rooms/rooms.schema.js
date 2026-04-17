'use strict';

const Joi = require('joi');

const ROOM_TYPES = ['cabin', 'room', 'pasadia', 'additional'];

const createRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().max(100).optional(),
  type: Joi.string()
    .valid(...ROOM_TYPES)
    .required(),
  description: Joi.string().allow('', null).optional(),
  short_desc: Joi.string().max(300).allow('', null).optional(),
  capacity: Joi.number().integer().min(1).max(32767).required(),
  base_price: Joi.number().precision(2).min(0).required(),
  amenities: Joi.array().items(Joi.string()).default([]),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().min(0).default(0),
  media_ids: Joi.array().items(Joi.string().uuid()).optional(),
  cover_media_id: Joi.string().uuid().allow(null).optional(),
});

const linkRoomMediaSchema = Joi.object({
  media_id: Joi.string().uuid().required(),
  is_cover: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional(),
});

const patchRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  slug: Joi.string().max(100).optional(),
  type: Joi.string()
    .valid(...ROOM_TYPES)
    .optional(),
  description: Joi.string().allow('', null).optional(),
  short_desc: Joi.string().max(300).allow('', null).optional(),
  capacity: Joi.number().integer().min(1).max(32767).optional(),
  base_price: Joi.number().precision(2).min(0).optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  is_active: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional(),
  media_ids: Joi.array().items(Joi.string().uuid()).optional(),
  cover_media_id: Joi.string().uuid().allow(null).optional(),
}).min(1);

module.exports = {
  createRoomSchema,
  patchRoomSchema,
  linkRoomMediaSchema,
  ROOM_TYPES,
};
