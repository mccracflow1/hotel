'use strict';

const availabilityService = require('./availability.service');
const { queryAvailabilitySchema, calendarSchema, configureSlotsSchema, blockDatesSchema } = require('./availability.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

const availabilityController = {
  async getAvailability(req, res, next) {
    try {
      const query = validate(queryAvailabilitySchema, req.query);
      const resultados = await availabilityService.getAvailability(query);
      return res.status(200).json({
        fecha_inicio: query.fecha_inicio,
        fecha_fin: query.fecha_fin,
        resultados,
      });
    } catch (err) {
      return next(err);
    }
  },

  async getCalendar(req, res, next) {
    try {
      const { year, month } = validate(calendarSchema, {
        year: Number(req.query.year),
        month: Number(req.query.month),
      });
      const dias = await availabilityService.getCalendar(year, month);
      return res.status(200).json({ year, month, timezone: 'America/Bogota', dias });
    } catch (err) {
      return next(err);
    }
  },

  async configureSlots(req, res, next) {
    try {
      const data = validate(configureSlotsSchema, req.body);
      const result = await availabilityService.configureSlots(data);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async blockDates(req, res, next) {
    try {
      const data = validate(blockDatesSchema, req.body);
      const { fechasAfectadas, rowsUpdated } = await availabilityService.blockDates(data);
      return res.status(200).json({
        fechas_afectadas: fechasAfectadas,
        slots_bloqueados: data.slots_a_bloquear,
        registros_actualizados: rowsUpdated,
      });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = availabilityController;
