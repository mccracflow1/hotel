/**
 * Migration 003: plans, plan_media, plan_activities,
 *                optional_activities, plan_optional_activities
 */
exports.up = async function (knex) {
  // ENUM compartido entre plans y optional_activities
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE price_unit AS ENUM ('per_person', 'per_group', 'per_night', 'per_session');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // plans: planes experienciales del hotel
  await knex.schema.createTable('plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.string('short_desc', 300).nullable();
    table.text('long_desc').nullable();
    table.decimal('base_price', 12, 2).notNullable();
    table.specificType('price_unit', 'price_unit').notNullable().defaultTo('per_group');
    table.smallint('max_persons').notNullable();
    table.smallint('min_nights').notNullable().defaultTo(1);
    table.uuid('room_id').nullable().references('id').inTable('rooms').onDelete('SET NULL');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.smallint('sort_order').notNullable().defaultTo(0);
    table.timestamptz('deleted_at').nullable();
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamptz('updated_at').nullable();
  });

  // plan_media: relación N:N plans ↔ media_library
  await knex.schema.createTable('plan_media', (table) => {
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.uuid('media_id').notNullable().references('id').inTable('media_library').onDelete('CASCADE');
    table.boolean('is_cover').notNullable().defaultTo(false);
    table.smallint('sort_order').notNullable().defaultTo(0);
    table.primary(['plan_id', 'media_id']);
  });

  // plan_activities: actividades BASE incluidas en el plan (inmutables al reservar)
  await knex.schema.createTable('plan_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.string('name', 150).notNullable();
    table.text('description').nullable();
    table.decimal('extra_cost', 10, 2).notNullable().defaultTo(0);
    table.smallint('sort_order').notNullable().defaultTo(0);
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // optional_activities: catálogo GLOBAL de actividades opcionales del hotel
  await knex.schema.createTable('optional_activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 150).notNullable();
    table.text('description').nullable();
    table.decimal('price', 10, 2).notNullable();
    table.specificType('price_unit', 'price_unit').notNullable().defaultTo('per_person');
    table.smallint('duration_minutes').nullable();
    table.smallint('max_persons').nullable();
    table.uuid('media_id').nullable().references('id').inTable('media_library').onDelete('SET NULL');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // plan_optional_activities: qué opcionales están disponibles en cada plan
  await knex.schema.createTable('plan_optional_activities', (table) => {
    table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table
      .uuid('optional_activity_id')
      .notNullable()
      .references('id')
      .inTable('optional_activities')
      .onDelete('CASCADE');
    table.boolean('is_default').notNullable().defaultTo(false);
    table.primary(['plan_id', 'optional_activity_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('plan_optional_activities');
  await knex.schema.dropTableIfExists('optional_activities');
  await knex.schema.dropTableIfExists('plan_activities');
  await knex.schema.dropTableIfExists('plan_media');
  await knex.schema.dropTableIfExists('plans');
  await knex.raw('DROP TYPE IF EXISTS price_unit');
};
