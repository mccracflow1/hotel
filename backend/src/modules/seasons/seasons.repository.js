'use strict';

const db = require('../../config/database');
const { NotFoundError } = require('../../middlewares/error-handler');

const seasonsRepository = {
  async findAll() {
    return db('seasons').orderBy('date_start', 'asc');
  },

  async findById(id) {
    const row = await db('seasons').where({ id }).first();
    if (!row) throw new NotFoundError('Temporada no encontrada');
    return row;
  },

  async findActiveForDateRange(dateStart, dateEnd) {
    return db('seasons')
      .where('date_start', '<=', dateEnd)
      .where('date_end', '>=', dateStart)
      .orderBy('price_multiplier', 'desc');
  },

  async findActiveForDate(date) {
    return db('seasons')
      .where('date_start', '<=', date)
      .where('date_end', '>=', date)
      .orderBy('price_multiplier', 'desc');
  },

  async create(data) {
    const [row] = await db('seasons')
      .insert({
        name: data.nombre,
        date_start: data.fecha_inicio,
        date_end: data.fecha_fin,
        price_multiplier: data.multiplicador,
      })
      .returning('*');
    return row;
  },

  async update(id, data) {
    await this.findById(id);
    const updates = {};
    if (data.nombre !== undefined) updates.name = data.nombre;
    if (data.fecha_inicio !== undefined) updates.date_start = data.fecha_inicio;
    if (data.fecha_fin !== undefined) updates.date_end = data.fecha_fin;
    if (data.multiplicador !== undefined) updates.price_multiplier = data.multiplicador;
    updates.updated_at = db.fn.now();
    const [row] = await db('seasons').where({ id }).update(updates).returning('*');
    return row;
  },

  async delete(id) {
    await this.findById(id);
    return db('seasons').where({ id }).delete();
  },
};

module.exports = seasonsRepository;
