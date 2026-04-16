'use strict';

const db = require('../../config/database');

const availabilityRepository = {
  /**
   * Llama a la función PL/pgSQL check_availability() dentro de una transacción.
   * La función usa SELECT FOR UPDATE SKIP LOCKED para garantizar no doble-reserva.
   */
  async checkAvailability(roomId, planId, dateStart, dateEnd) {
    return db.transaction(async (trx) => {
      const result = await trx.raw(
        'SELECT * FROM check_availability(?, ?, ?, ?)',
        [roomId, planId, dateStart, dateEnd]
      );
      return result.rows;
    });
  },

  /**
   * Consulta de disponibilidad con precios (para GET /availability).
   * Filtra por tipo de servicio y número de personas si se proporcionan.
   * Calcula precio_efectivo con el multiplicador de temporada más alto aplicable.
   */
  async findWithPricing({ fecha_inicio, fecha_fin, tipo_servicio, num_personas }) {
    const results = [];

    if (!tipo_servicio || tipo_servicio === 'room') {
      const rooms = await db('rooms as r')
        .leftJoin('availability as av', function () {
          this.on('av.room_id', 'r.id').andOn(db.raw('av.date BETWEEN ? AND ?', [fecha_inicio, fecha_fin]));
        })
        .leftJoin(
          db('seasons')
            .where('date_start', '<=', fecha_fin)
            .where('date_end', '>=', fecha_inicio)
            .orderBy('price_multiplier', 'desc')
            .limit(1)
            .as('s'),
          db.raw('true')
        )
        .leftJoin('room_media as rm', function () {
          this.on('rm.room_id', 'r.id').andOnVal('rm.is_cover', true);
        })
        .leftJoin('media_library as ml', 'ml.id', 'rm.media_id')
        .whereNull('r.deleted_at')
        .select(
          'r.id',
          'r.name',
          'r.slug',
          'r.short_desc as descripcion_corta',
          'r.base_price',
          db.raw("COALESCE(av.special_price, r.base_price * COALESCE(s.price_multiplier, 1.0)) as precio_efectivo"),
          's.price_multiplier as multiplicador_temporada',
          's.name as nombre_temporada',
          db.raw('COALESCE(av.total_slots - av.blocked_slots, 0) as slots_disponibles'),
          'ml.original_url as media_cover'
        )
        .groupBy('r.id', 'r.name', 'r.slug', 'r.short_desc', 'r.base_price', 'av.special_price', 's.price_multiplier', 's.name', 'av.total_slots', 'av.blocked_slots', 'ml.original_url');

      for (const room of rooms) {
        const slotsDisponibles = Number(room.slots_disponibles);
        results.push({
          tipo: 'room',
          id: room.id,
          nombre: room.name,
          descripcion_corta: room.descripcion_corta,
          precio_base: Number(room.base_price),
          precio_efectivo: Number(room.precio_efectivo),
          multiplicador_temporada: room.multiplicador_temporada ? Number(room.multiplicador_temporada) : null,
          nombre_temporada: room.nombre_temporada || null,
          disponible: slotsDisponibles > 0,
          slots_disponibles: slotsDisponibles,
          media_cover: room.media_cover || null,
        });
      }
    }

    if (!tipo_servicio || tipo_servicio === 'plan') {
      let planQuery = db('plans as p')
        .leftJoin('availability as av', function () {
          this.on('av.plan_id', 'p.id').andOn(db.raw('av.date BETWEEN ? AND ?', [fecha_inicio, fecha_fin]));
        })
        .leftJoin(
          db('seasons')
            .where('date_start', '<=', fecha_fin)
            .where('date_end', '>=', fecha_inicio)
            .orderBy('price_multiplier', 'desc')
            .limit(1)
            .as('s'),
          db.raw('true')
        )
        .leftJoin('plan_media as pm', function () {
          this.on('pm.plan_id', 'p.id').andOnVal('pm.is_cover', true);
        })
        .leftJoin('media_library as ml', 'ml.id', 'pm.media_id')
        .whereNull('p.deleted_at')
        .select(
          'p.id',
          'p.name',
          'p.slug',
          'p.short_desc as descripcion_corta',
          'p.base_price',
          'p.max_persons',
          db.raw("COALESCE(av.special_price, p.base_price * COALESCE(s.price_multiplier, 1.0)) as precio_efectivo"),
          's.price_multiplier as multiplicador_temporada',
          's.name as nombre_temporada',
          db.raw('COALESCE(av.total_slots - av.blocked_slots, 0) as slots_disponibles'),
          'ml.original_url as media_cover'
        )
        .groupBy('p.id', 'p.name', 'p.slug', 'p.short_desc', 'p.base_price', 'p.max_persons', 'av.special_price', 's.price_multiplier', 's.name', 'av.total_slots', 'av.blocked_slots', 'ml.original_url');

      if (num_personas) {
        planQuery = planQuery.where('p.max_persons', '>=', num_personas);
      }

      const plans = await planQuery;
      for (const plan of plans) {
        const slotsDisponibles = Number(plan.slots_disponibles);
        results.push({
          tipo: 'plan',
          id: plan.id,
          nombre: plan.name,
          descripcion_corta: plan.descripcion_corta,
          precio_base: Number(plan.base_price),
          precio_efectivo: Number(plan.precio_efectivo),
          multiplicador_temporada: plan.multiplicador_temporada ? Number(plan.multiplicador_temporada) : null,
          nombre_temporada: plan.nombre_temporada || null,
          disponible: slotsDisponibles > 0,
          slots_disponibles: slotsDisponibles,
          media_cover: plan.media_cover || null,
        });
      }
    }

    return results;
  },

  /**
   * Datos para el calendario mensual de ocupación.
   */
  async getCalendarData(year, month) {
    const dateStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const rows = await db('availability as av')
      .leftJoin(
        db('seasons')
          .where('date_start', '<=', dateEnd)
          .where('date_end', '>=', dateStart)
          .as('s'),
        db.raw('av.date BETWEEN s.date_start AND s.date_end')
      )
      .leftJoin(
        db('reservations')
          .whereIn('status', ['PENDING', 'CONFIRMED'])
          .as('r'),
        db.raw('r.date_start <= av.date AND r.date_end > av.date AND (r.room_id = av.room_id OR r.plan_id = av.plan_id)')
      )
      .whereBetween('av.date', [dateStart, dateEnd])
      .select(
        'av.date',
        db.raw('SUM(av.total_slots) as total_slots'),
        db.raw('SUM(av.blocked_slots) as blocked_slots'),
        db.raw('COUNT(DISTINCT r.id) as reservas_activas'),
        db.raw('MAX(s.price_multiplier) as max_multiplicador'),
        db.raw('MAX(s.name) as nombre_temporada')
      )
      .groupBy('av.date')
      .orderBy('av.date');

    return rows.map((row) => {
      const total = Number(row.total_slots) || 0;
      const bloqueados = Number(row.blocked_slots) || 0;
      const reservas = Number(row.reservas_activas) || 0;
      const ocupados = bloqueados + reservas;
      return {
        fecha: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
        porcentaje_ocupacion: total > 0 ? Math.round((ocupados / total) * 100) : 0,
        slots_totales: total,
        slots_ocupados: ocupados,
        slots_bloqueados: bloqueados,
        tiene_temporada: !!row.max_multiplicador,
        nombre_temporada: row.nombre_temporada || null,
      };
    });
  },

  async upsertAvailability(data) {
    const [row] = await db('availability')
      .insert({
        room_id: data.room_id || null,
        plan_id: data.plan_id || null,
        date: data.date,
        total_slots: data.total_slots,
        blocked_slots: 0,
        special_price: data.special_price || null,
      })
      .onConflict(['room_id', 'plan_id', 'date'])
      .merge(['total_slots', 'special_price'])
      .returning('*');
    return row;
  },

  async blockDateRange(roomId, planId, dateStart, dateEnd, slotsToBlock, reason) {
    // Actualizar todos los registros de availability en el rango
    const affectedRows = await db('availability')
      .modify((qb) => {
        if (roomId) qb.where('room_id', roomId);
        if (planId) qb.where('plan_id', planId);
      })
      .whereBetween('date', [dateStart, dateEnd])
      .increment('blocked_slots', slotsToBlock)
      .update({ block_reason: reason });

    // Generar la lista de fechas afectadas
    const fechas = [];
    const current = new Date(dateStart);
    const end = new Date(dateEnd);
    while (current <= end) {
      fechas.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    return { fechasAfectadas: fechas, rowsUpdated: affectedRows };
  },
};

module.exports = availabilityRepository;
