'use strict';

const seasonsRepository = require('./seasons.repository');
const availabilityService = require('../availability/availability.service');
const { ValidationError } = require('../../middlewares/error-handler');

const seasonsService = {
  async findAll() {
    return seasonsRepository.findAll();
  },

  async findById(id) {
    return seasonsRepository.findById(id);
  },

  async create(data) {
    if (data.fecha_fin < data.fecha_inicio) {
      throw new ValidationError('fecha_fin debe ser igual o posterior a fecha_inicio');
    }
    const overlap = await seasonsRepository.countOverlapping(data.fecha_inicio, data.fecha_fin, null);
    if (overlap > 0) {
      throw new ValidationError('Las fechas se solapan con otra temporada existente');
    }
    const season = await seasonsRepository.create(data);
    availabilityService.invalidateCalendarCache();
    return season;
  },

  async update(id, data) {
    const existing = await seasonsRepository.findById(id);
    const start = data.fecha_inicio !== undefined ? data.fecha_inicio : existing.date_start;
    const end = data.fecha_fin !== undefined ? data.fecha_fin : existing.date_end;
    if (end < start) {
      throw new ValidationError('fecha_fin debe ser igual o posterior a fecha_inicio');
    }
    const overlap = await seasonsRepository.countOverlapping(start, end, id);
    if (overlap > 0) {
      throw new ValidationError('Las fechas se solapan con otra temporada existente');
    }
    const season = await seasonsRepository.update(id, data);
    availabilityService.invalidateCalendarCache();
    return season;
  },

  async delete(id) {
    await seasonsRepository.delete(id);
    availabilityService.invalidateCalendarCache();
  },
};

module.exports = seasonsService;
