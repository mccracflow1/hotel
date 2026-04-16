/**
 * Migration 012: rooms.short_desc + reservation_number_sequences for HT-YYYY-NNNNN
 */
exports.up = async function (knex) {
  await knex.schema.table('rooms', (table) => {
    table.string('short_desc', 300).nullable();
  });

  await knex.schema.createTable('reservation_number_sequences', (table) => {
    table.smallint('year').primary();
    table.bigInteger('last_value').notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('reservation_number_sequences');
  await knex.schema.table('rooms', (table) => {
    table.dropColumn('short_desc');
  });
};
