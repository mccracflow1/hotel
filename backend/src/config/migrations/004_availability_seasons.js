/**
 * Migration 004: seasons, availability
 */
exports.up = async function (knex) {
  // seasons: temporadas de precios del hotel
  await knex.schema.createTable('seasons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 80).notNullable();
    table.date('date_start').notNullable();
    table.date('date_end').notNullable();
    // 1.0 = precio normal, 1.4 = +40%
    table.decimal('price_multiplier', 4, 2).notNullable().defaultTo(1.0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // availability: cupos por fecha, habitación y/o plan
  await knex.schema.createTable('availability', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('room_id').nullable().references('id').inTable('rooms').onDelete('CASCADE');
    table.uuid('plan_id').nullable().references('id').inTable('plans').onDelete('CASCADE');
    table.date('date').notNullable();
    table.smallint('total_slots').notNullable().defaultTo(1);
    table.smallint('blocked_slots').notNullable().defaultTo(0);
    table.string('block_reason', 200).nullable();
    // override de precio para ese día específico
    table.decimal('special_price', 12, 2).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Índice para el query más frecuente del sistema
  await knex.schema.table('availability', (table) => {
    table.index(['room_id', 'plan_id', 'date']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('availability');
  await knex.schema.dropTableIfExists('seasons');
};
