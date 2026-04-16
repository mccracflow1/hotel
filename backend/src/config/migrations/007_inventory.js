/**
 * Migration 007: suppliers, inventory_items, inventory_movements
 */
exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE inv_category AS ENUM ('food', 'beverages', 'cleaning', 'maintenance', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE mov_type AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // suppliers: proveedores del hotel
  await knex.schema.createTable('suppliers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 120).notNullable();
    table.string('phone', 30).nullable();
    table.string('email', 200).nullable();
    table.text('address').nullable();
    table.text('notes').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // inventory_items: ítems del inventario del hotel
  await knex.schema.createTable('inventory_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 120).notNullable();
    table.specificType('category', 'inv_category').notNullable();
    table.string('unit', 30).notNullable(); // 'unidades', 'litros', 'kg'
    table.decimal('current_stock', 10, 3).notNullable().defaultTo(0);
    table.decimal('min_stock', 10, 3).notNullable().defaultTo(0);
    table.uuid('supplier_id').nullable().references('id').inTable('suppliers').onDelete('SET NULL');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamptz('updated_at').nullable();
  });

  // inventory_movements: cada entrada, salida o ajuste de inventario
  await knex.schema.createTable('inventory_movements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('item_id')
      .notNullable()
      .references('id')
      .inTable('inventory_items')
      .onDelete('RESTRICT');
    table.specificType('type', 'mov_type').notNullable();
    table.decimal('quantity', 10, 3).notNullable();
    table.text('notes').nullable();
    // Consumo asociado a una reserva (opcional)
    table
      .uuid('reservation_id')
      .nullable()
      .references('id')
      .inTable('reservations')
      .onDelete('SET NULL');
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamptz('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.table('inventory_movements', (table) => {
    table.index(['item_id', 'created_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory_movements');
  await knex.schema.dropTableIfExists('inventory_items');
  await knex.schema.dropTableIfExists('suppliers');
  await knex.raw('DROP TYPE IF EXISTS mov_type');
  await knex.raw('DROP TYPE IF EXISTS inv_category');
};
