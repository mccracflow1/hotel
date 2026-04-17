'use strict';

/**
 * Claves canónicas por sección (maestro §17 / CONTEXTO):
 * - hero: title, subtitle, cta_text, background_image_url, …
 * - contact: phone, whatsapp, email, address, maps_embed_url, redes…
 * - about: title, body, image_url, …
 * - gallery: images (list_json de UUIDs o objetos resueltos en público)
 * La API acepta cualquier `key` acotada por longitud; el admin guía al operador con formularios por sección.
 */
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
