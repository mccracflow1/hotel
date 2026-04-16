/**
 * Migration 010: Funciones PL/pgSQL, triggers de auditoría, pg_cron
 *
 * - check_availability(): función de concurrencia con SELECT FOR UPDATE SKIP LOCKED
 * - log_changes(): trigger para audit_logs en tablas críticas
 * - pg_cron: limpieza de idempotency_keys expiradas cada hora
 */
exports.up = async function (knex) {
  // ── Función de control de concurrencia ──────────────────────────────────────
  await knex.raw(`
    CREATE OR REPLACE FUNCTION check_availability(
      p_room_id UUID,
      p_plan_id UUID,
      p_date_start DATE,
      p_date_end DATE
    ) RETURNS BOOLEAN AS $$
    DECLARE
      conflict_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO conflict_count
      FROM reservations
      WHERE (
        (p_room_id IS NOT NULL AND room_id = p_room_id) OR
        (p_plan_id IS NOT NULL AND plan_id = p_plan_id)
      )
        AND status IN ('PENDING', 'CONFIRMED')
        AND date_start < p_date_end
        AND date_end > p_date_start
      FOR UPDATE SKIP LOCKED;

      RETURN conflict_count = 0;
    END;
    $$ LANGUAGE plpgsql
  `);

  // ── Función de auditoría automática ────────────────────────────────────────
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_changes() RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data)
      VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END
      );
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql
  `);

  // ── Triggers en tablas críticas ──────────────────────────────────────────
  const auditedTables = [
    'reservations',
    'payments',
    'rooms',
    'plans',
    'users',
    'inventory_items',
  ];

  for (const tableName of auditedTables) {
    await knex.raw(`
      DROP TRIGGER IF EXISTS audit_${tableName} ON ${tableName};
      CREATE TRIGGER audit_${tableName}
        AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
        FOR EACH ROW EXECUTE FUNCTION log_changes()
    `);
  }

  // ── pg_cron: limpieza de idempotency_keys expiradas cada hora ────────────
  // pg_cron debe estar instalado en PostgreSQL (disponible en Railway y la mayoría
  // de proveedores managed). Si no está disponible, este bloque se omite silenciosamente.
  try {
    await knex.raw(`
      SELECT cron.schedule(
        'cleanup-idempotency-keys',
        '0 * * * *',
        $$ DELETE FROM idempotency_keys WHERE expires_at < NOW() $$
      )
    `);
  } catch {
    // pg_cron no disponible en este entorno; la limpieza se hará manualmente
    // o con un worker de Node.js en Semana 2.
  }
};

exports.down = async function (knex) {
  // Intentar remover el job de pg_cron
  try {
    await knex.raw(`SELECT cron.unschedule('cleanup-idempotency-keys')`);
  } catch {
    // Ignorar si pg_cron no está disponible
  }

  const auditedTables = [
    'reservations',
    'payments',
    'rooms',
    'plans',
    'users',
    'inventory_items',
  ];

  for (const tableName of auditedTables) {
    await knex.raw(`DROP TRIGGER IF EXISTS audit_${tableName} ON ${tableName}`);
  }

  await knex.raw('DROP FUNCTION IF EXISTS log_changes()');
  await knex.raw('DROP FUNCTION IF EXISTS check_availability(UUID, UUID, DATE, DATE)');
};
