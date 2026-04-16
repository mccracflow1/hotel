'use strict';

const Joi = require('joi');

const createSeasonSchema = Joi.object({
  nombre: Joi.string().min(3).max(255).required(),
  fecha_inicio: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  fecha_fin: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .custom((value, helpers) => {
      const { fecha_inicio } = helpers.state.ancestors[0];
      if (fecha_inicio && value < fecha_inicio) return helpers.error('date.order');
      return value;
    })
    .messages({ 'date.order': 'fecha_fin debe ser igual o posterior a fecha_inicio' }),
  multiplicador: Joi.number().min(0.01).max(99.99).required(),
});

const updateSeasonSchema = Joi.object({
  nombre: Joi.string().min(3).max(255).optional(),
  fecha_inicio: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  multiplicador: Joi.number().min(0.01).max(99.99).optional(),
}).min(1);

module.exports = { createSeasonSchema, updateSeasonSchema };
