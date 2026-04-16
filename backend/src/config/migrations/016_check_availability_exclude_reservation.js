/**
 * Extiende check_availability para excluir la reserva actual al cambiar fechas.
 * Ajusta solape usando COALESCE(date_end, date_start) para estadías de un día.
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION check_availability(
      p_room_id UUID,
      p_plan_id UUID,
      p_date_start DATE,
      p_date_end DATE,
      p_exclude_reservation_id UUID DEFAULT NULL
    ) RETURNS BOOLEAN AS $$
    DECLARE
      conflict_count INTEGER;
      v_end DATE := COALESCE(p_date_end, p_date_start);
    BEGIN
      SELECT COUNT(*) INTO conflict_count
      FROM reservations r
      WHERE (
        (p_room_id IS NOT NULL AND r.room_id = p_room_id) OR
        (p_plan_id IS NOT NULL AND r.plan_id = p_plan_id)
      )
        AND r.status IN ('PENDING', 'CONFIRMED', 'PAYMENT_PENDING')
        AND (p_exclude_reservation_id IS NULL OR r.id <> p_exclude_reservation_id)
        AND r.date_start <= v_end
        AND COALESCE(r.date_end, r.date_start) >= p_date_start
      FOR UPDATE SKIP LOCKED;

      RETURN conflict_count = 0;
    END;
    $$ LANGUAGE plpgsql
  `);
};

exports.down = async function (knex) {
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
};
