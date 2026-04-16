'use strict';

const NodeCache = require('node-cache');
const availabilityRepository = require('./availability.repository');
const { AppError } = require('../../middlewares/error-handler');

// TTL de 60 segundos para el calendario mensual
const nodeCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

const availabilityService = {
  async getAvailability(query) {
    return availabilityRepository.findWithPricing(query);
  },

  async getCalendar(year, month) {
    const cacheKey = `calendar-${year}-${month}`;
    const cached = nodeCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const data = await availabilityRepository.getCalendarData(year, month);
    nodeCache.set(cacheKey, data);
    return data;
  },

  invalidateCalendarCache() {
    nodeCache.flushAll();
  },

  async configureSlots(data) {
    if (!data.room_id && !data.plan_id) {
      throw new AppError('INVALID_ENTITY', 'Se requiere room_id o plan_id', 400);
    }
    const result = await availabilityRepository.upsertAvailability(data);
    this.invalidateCalendarCache();
    return result;
  },

  async blockDates(data) {
    if (!data.room_id && !data.plan_id) {
      throw new AppError('INVALID_ENTITY', 'Se requiere room_id o plan_id', 400);
    }
    if (!data.motivo || data.motivo.trim().length < 3) {
      throw new AppError('MISSING_REASON', 'El motivo de bloqueo es obligatorio (mínimo 3 caracteres)', 400);
    }

    const result = await availabilityRepository.blockDateRange(
      data.room_id || null,
      data.plan_id || null,
      data.fecha_inicio,
      data.fecha_fin,
      data.slots_a_bloquear,
      data.motivo
    );

    this.invalidateCalendarCache();
    return result;
  },
};

module.exports = availabilityService;
