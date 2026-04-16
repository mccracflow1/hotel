'use strict';

const Joi = require('joi');

const today = () => new Date().toISOString().slice(0, 10);

const queryAvailabilitySchema = Joi.object({
  fecha_inicio: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .custom((value, helpers) => {
      if (value < today()) return helpers.error('date.past');
      return value;
    })
    .messages({ 'date.past': 'fecha_inicio no puede ser anterior a hoy' }),

  fecha_fin: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .custom((value, helpers) => {
      const { fecha_inicio } = helpers.state.ancestors[0];
      if (fecha_inicio && value < fecha_inicio) return helpers.error('date.order');
      if (fecha_inicio) {
        const diff = (new Date(value) - new Date(fecha_inicio)) / (1000 * 60 * 60 * 24);
        if (diff > 90) return helpers.error('date.range');
      }
      return value;
    })
    .messages({
      'date.order': 'fecha_fin debe ser igual o posterior a fecha_inicio',
      'date.range': 'El rango de fechas no puede superar 90 días',
    }),

  tipo_servicio: Joi.string().valid('room', 'plan').optional(),
  num_personas: Joi.number().integer().min(1).optional(),
});

const calendarSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).required(),
});

const configureSlotsSchema = Joi.object({
  room_id: Joi.string().uuid().optional().allow(null),
  plan_id: Joi.string().uuid().optional().allow(null),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  total_slots: Joi.number().integer().min(1).required(),
  special_price: Joi.number().min(0).optional().allow(null),
}).custom((value, helpers) => {
  if (!value.room_id && !value.plan_id) return helpers.error('any.custom');
  return value;
}).messages({ 'any.custom': 'Se requiere al menos room_id o plan_id' });

const blockDatesSchema = Joi.object({
  room_id: Joi.string().uuid().optional().allow(null),
  plan_id: Joi.string().uuid().optional().allow(null),
  fecha_inicio: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  fecha_fin: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  slots_a_bloquear: Joi.number().integer().min(1).required(),
  motivo: Joi.string().min(3).max(500).required(),
});

module.exports = { queryAvailabilitySchema, calendarSchema, configureSlotsSchema, blockDatesSchema };
