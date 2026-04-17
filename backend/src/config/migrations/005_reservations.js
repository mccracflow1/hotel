/**
 * Migration 005: reservations, reservation_activity_snapshot,
 *                reservation_optional_activities
 */
exports.up = async function (knex) {
  // 5 estados del ciclo de vida de una reserva
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE reservation_status AS ENUM (
        'PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await knex.schema.createTable('reservations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('reservation_number', 20).notNullable().unique(); // HT-2026-00001
    table.uuid('room_id').nullable().references('id').inTable('rooms').onDelete('RESTRICT');
    table.uuid('plan_id').nullable().references('id').inTable('plans').onDelete('RESTRICT');
    table.string('customer_name', 200).notNullable();
    table.string('customer_document', 30).notNullable();
    table.string('customer_email', 200).nullable();
    table.string('customer_phone', 30).notNullable();
    table.date('date_start').notNullable();
    table.date('date_end').nullable();
    table.smallint('adults').notNullable();
    table.smallint('children').notNullable().defaultTo(0);
    table.specificType('status', 'reservation_status').notNullable().defaultTo('PENDING');
    table.decimal('total_amount', 12, 2).notNullable();
    table.string('cancellation_reason', 200).nullable();
    table.text('notes').nullable();
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    // Para bloqueo optimista como fallback
    table.integer('version').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).nullable();
  });

  // reservation_activity_snapshot: COPIA INMUTABLE de actividades base al momento de reservar
  await knex.schema.createTable('reservation_activity_snapshot', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('reservation_id')
      .notNullable()
      .references('id')
      .inTable('reservations')
      .onDelete('CASCADE');
    table.string('activity_name', 150).notNullable();
    table.text('description').nullable();
    table.decimal('extra_cost', 10, 2).notNullable().defaultTo(0);
    table.smallint('sort_order').notNullable().defaultTo(0);
    // Sin timestamps: este registro es inmutable
  });

  // reservation_optional_activities: opcionales que el cliente eligió al reservar
  await knex.schema.createTable('reservation_optional_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('reservation_id')
      .notNullable()
      .references('id')
      .inTable('reservations')
      .onDelete('CASCADE');
    table
      .uuid('optional_activity_id')
      .nullable()
      .references('id')
      .inTable('optional_activities')
      .onDelete('SET NULL');
    // Snapshots del momento de la reserva
    table.string('activity_name_snapshot', 150).notNullable();
    table.decimal('price_snapshot', 10, 2).notNullable();
    table.smallint('quantity').notNullable().defaultTo(1);
  });

  // Índice para verificación de concurrencia (SELECT FOR UPDATE SKIP LOCKED)
  await knex.schema.table('reservations', (table) => {
    table.index(['room_id', 'plan_id', 'date_start', 'date_end'], 'idx_reservations_dates');
    table.index('status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('reservation_optional_activities');
  await knex.schema.dropTableIfExists('reservation_activity_snapshot');
  await knex.schema.dropTableIfExists('reservations');
  await knex.raw('DROP TYPE IF EXISTS reservation_status');
};
