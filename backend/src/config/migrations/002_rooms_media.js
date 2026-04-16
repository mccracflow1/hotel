/**
 * Migration 002: media_library, rooms, room_media
 *
 * media_library se crea aquí (no en 009) porque rooms y plans la referencian.
 */
exports.up = async function (knex) {
  // ENUMs
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE room_type AS ENUM ('cabin', 'room', 'pasadia', 'additional');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE media_type AS ENUM ('image', 'video', 'youtube', 'vimeo');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // media_library: repositorio centralizado de archivos
  await knex.schema.createTable('media_library', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('filename', 255).notNullable();
    table.text('original_url').notNullable();
    table.text('thumbnail_url').nullable();
    table.specificType('file_type', 'media_type').notNullable();
    table.string('mime_type', 80).nullable();
    table.bigInteger('size_bytes').nullable();
    table.uuid('uploaded_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // rooms: habitaciones, cabañas y servicios del hotel
  await knex.schema.createTable('rooms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.specificType('type', 'room_type').notNullable();
    table.text('description').nullable();
    table.smallint('capacity').notNullable();
    table.decimal('base_price', 12, 2).notNullable();
    table.jsonb('amenities').notNullable().defaultTo('[]');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.smallint('sort_order').notNullable().defaultTo(0);
    table.timestamptz('deleted_at').nullable();
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamptz('updated_at').nullable();
  });

  // room_media: relación N:N rooms ↔ media_library
  await knex.schema.createTable('room_media', (table) => {
    table.uuid('room_id').notNullable().references('id').inTable('rooms').onDelete('CASCADE');
    table.uuid('media_id').notNullable().references('id').inTable('media_library').onDelete('CASCADE');
    table.boolean('is_cover').notNullable().defaultTo(false);
    table.smallint('sort_order').notNullable().defaultTo(0);
    table.primary(['room_id', 'media_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('room_media');
  await knex.schema.dropTableIfExists('rooms');
  await knex.schema.dropTableIfExists('media_library');
  await knex.raw('DROP TYPE IF EXISTS media_type');
  await knex.raw('DROP TYPE IF EXISTS room_type');
};
