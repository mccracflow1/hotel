'use strict';

const Joi = require('joi');

const siteContentEntrySchema = Joi.object({
  section: Joi.string().optional(),
  key: Joi.string().max(80).required(),
  value: Joi.string().allow('', null).optional(),
  type: Joi.string().valid('text', 'image_url', 'list_json', 'richtext').optional(),
});

const putSectionSchema = Joi.object({
  entries: Joi.array().items(siteContentEntrySchema).min(1).required(),
});

const createFaqSchema = Joi.object({
  question: Joi.string().required(),
  answer: Joi.string().required(),
  sort_order: Joi.number().integer().optional(),
  is_active: Joi.boolean().optional(),
});

const patchFaqSchema = Joi.object({
  question: Joi.string().optional(),
  answer: Joi.string().optional(),
  sort_order: Joi.number().integer().optional(),
  is_active: Joi.boolean().optional(),
});

const reorderFaqsSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

module.exports = {
  siteContentEntrySchema,
  putSectionSchema,
  createFaqSchema,
  patchFaqSchema,
  reorderFaqsSchema,
};
