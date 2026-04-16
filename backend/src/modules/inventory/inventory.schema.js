'use strict';

const Joi = require('joi');

const createItemSchema = Joi.object({
  name: Joi.string().max(120).required(),
  category: Joi.string()
    .valid('food', 'beverages', 'cleaning', 'maintenance', 'other')
    .required(),
  unit: Joi.string().max(30).required(),
  current_stock: Joi.number().min(0).default(0),
  min_stock: Joi.number().min(0).default(0),
  supplier_id: Joi.string().uuid().allow(null),
  is_active: Joi.boolean().default(true),
});

const updateItemSchema = createItemSchema.fork(['name', 'category', 'unit'], (s) => s.optional()).min(1);

const movementSchema = Joi.object({
  item_id: Joi.string().uuid().required(),
  type: Joi.string().valid('ENTRY', 'EXIT', 'ADJUSTMENT').required(),
  quantity: Joi.number().positive().required(),
  notes: Joi.string().allow('', null),
  reservation_id: Joi.string().uuid().allow(null),
});

const listMovementsQuerySchema = Joi.object({
  type: Joi.string().valid('ENTRY', 'EXIT', 'ADJUSTMENT'),
  date_from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  date_to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  movementSchema,
  listMovementsQuerySchema,
};
