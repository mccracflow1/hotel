/**
 * Migration 009: Índices críticos (parciales y compuestos)
 *
 * Estos índices son esenciales para el rendimiento bajo carga empresarial.
 * Se crean en migración separada para claridad y poder revertirlos sin tocar datos.
 */
exports.up = async function (knex) {
  // Disponibilidad: el query más frecuente del sistema
  // Optimiza: GET /availability con filtros de fecha y servicio
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_availability_lookup
      ON availability (room_id, plan_id, date)
      WHERE blocked_slots < total_slots
  `);

  // Reservas activas: para verificación de concurrencia en nuevas reservas
  // Optimiza: SELECT FOR UPDATE SKIP LOCKED en check_availability
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_reservations_active
      ON reservations (room_id, plan_id, date_start, date_end)
      WHERE status IN ('PENDING', 'CONFIRMED')
  `);

  // Reservas por número: para búsqueda del agente IA
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_reservations_number
      ON reservations (reservation_number)
  `);

  // Reservas por cliente: para búsquedas en el portal admin
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_reservations_customer
      ON reservations (customer_document, customer_phone)
  `);

  // Inventario: alertas de stock bajo (consumido por GET /inventory/alerts)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
      ON inventory_items (id)
      WHERE current_stock < min_stock AND is_active = TRUE
  `);

  // Rooms activos (para landing pública)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_rooms_active
      ON rooms (sort_order, type)
      WHERE is_active = TRUE AND deleted_at IS NULL
  `);

  // Plans activos (para landing pública)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_plans_active
      ON plans (sort_order)
      WHERE is_active = TRUE AND deleted_at IS NULL
  `);

  // Plan activities ordenadas (para GET /plans/:id)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_plan_activities_order
      ON plan_activities (plan_id, sort_order)
  `);

  // Audit logs por entidad (para auditoría por registro)
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_audit_entity
      ON audit_logs (table_name, record_id, created_at DESC)
  `);
};

exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_audit_entity');
  await knex.raw('DROP INDEX IF EXISTS idx_plan_activities_order');
  await knex.raw('DROP INDEX IF EXISTS idx_plans_active');
  await knex.raw('DROP INDEX IF EXISTS idx_rooms_active');
  await knex.raw('DROP INDEX IF EXISTS idx_inventory_low_stock');
  await knex.raw('DROP INDEX IF EXISTS idx_reservations_customer');
  await knex.raw('DROP INDEX IF EXISTS idx_reservations_number');
  await knex.raw('DROP INDEX IF EXISTS idx_reservations_active');
  await knex.raw('DROP INDEX IF EXISTS idx_availability_lookup');
};
