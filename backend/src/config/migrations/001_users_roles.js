/**
 * Migration 001: users, user_role ENUM, refresh_tokens
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'BUSINESS', 'VIEWER', 'AGENT');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 120).notNullable();
    table.string('email', 200).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.specificType('role', 'user_role').notNullable().defaultTo('VIEWER');
    table.text('avatar_url').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamptz('last_login_at').nullable();
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamptz('updated_at').nullable();
  });

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable().unique();
    table.timestamptz('expires_at').notNullable();
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.table('refresh_tokens', (table) => {
    table.index('user_id');
    table.index('expires_at');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_role');
};
