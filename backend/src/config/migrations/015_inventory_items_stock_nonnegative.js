/**
 * Garantiza current_stock >= 0 a nivel BD (FR-015).
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE inventory_items
    DROP CONSTRAINT IF EXISTS inventory_items_current_stock_nonnegative
  `);
  await knex.raw(`
    ALTER TABLE inventory_items
    ADD CONSTRAINT inventory_items_current_stock_nonnegative
    CHECK (current_stock >= 0)
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE inventory_items
    DROP CONSTRAINT IF EXISTS inventory_items_current_stock_nonnegative
  `);
};
