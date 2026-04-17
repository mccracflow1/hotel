/**
 * Migration 008: site_content, faqs, business_config, audit_logs
 */
exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE content_type AS ENUM ('text', 'image_url', 'list_json', 'richtext');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // site_content: contenido editable de la landing (clave-valor por sección)
  await knex.schema.createTable('site_content', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('section', 60).notNullable();  // 'hero', 'contact', 'about', 'gallery'
    table.string('key', 80).notNullable();       // 'title', 'subtitle', 'cta_text'
    table.text('value').nullable();
    table.specificType('type', 'content_type').notNullable().defaultTo('text');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['section', 'key']);
  });

  // faqs: preguntas frecuentes de la landing
  await knex.schema.createTable('faqs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('question').notNullable();
    table.text('answer').notNullable();
    table.smallint('sort_order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).nullable();
  });

  // business_config: configuración global del negocio (una sola fila)
  await knex.schema.createTable('business_config', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('hotel_name', 150).notNullable();
    table.string('nit', 30).nullable();
    table.text('address').nullable();
    table.time('checkin_time').notNullable().defaultTo('15:00');
    table.time('checkout_time').notNullable().defaultTo('12:00');
    // [{"hours_before": 72, "penalty_pct": 0}, {"hours_before": 24, "penalty_pct": 50}]
    table.jsonb('cancellation_policy').nullable();
    // Almacenados encriptados en producción
    table.text('mp_public_key').nullable();
    table.text('mp_access_token').nullable();
    table.text('mp_webhook_secret').nullable();
    table.text('logo_url').nullable();
    table.specificType('primary_color', 'char(7)').nullable(); // HEX ej: '#1A3A5C'
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // audit_logs: registro inmutable de acciones críticas
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('table_name', 60).notNullable();
    table.uuid('record_id').nullable();
    table.string('operation', 10).notNullable(); // 'INSERT', 'UPDATE', 'DELETE'
    table.jsonb('old_data').nullable();
    table.jsonb('new_data').nullable();
    table.specificType('ip_address', 'inet').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.table('audit_logs', (table) => {
    table.index(['table_name', 'record_id']);
    table.index('created_at');
    table.index('user_id');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('business_config');
  await knex.schema.dropTableIfExists('faqs');
  await knex.schema.dropTableIfExists('site_content');
  await knex.raw('DROP TYPE IF EXISTS content_type');
};
