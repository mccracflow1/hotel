'use strict';

const seasonsRepository = require('./seasons.repository');
const availabilityService = require('../availability/availability.service');

const seasonsService = {
  async findAll() {
    return seasonsRepository.findAll();
  },

  async findById(id) {
    return seasonsRepository.findById(id);
  },

  async create(data) {
    if (data.fecha_fin < data.fecha_inicio) {
      throw new Error('fecha_fin debe ser igual o posterior a fecha_inicio');
    }
    const season = await seasonsRepository.create(data);
    availabilityService.invalidateCalendarCache();
    return season;
  },

  async update(id, data) {
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
