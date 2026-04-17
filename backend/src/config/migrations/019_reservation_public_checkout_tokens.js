/**
 * Opaque checkout tokens for anonymous landing → MercadoPago (009).
 * Plain token is shown once in POST /public/reservations response; only SHA-256 hash is stored.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('reservation_public_checkout_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('reservation_id').notNullable().references('id').inTable('reservations').onDelete('CASCADE');
    table.string('token_hash', 64).notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    'CREATE INDEX idx_reservation_public_checkout_tokens_reservation ON reservation_public_checkout_tokens (reservation_id)'
  );
  await knex.raw(
    'CREATE INDEX idx_reservation_public_checkout_tokens_expires ON reservation_public_checkout_tokens (expires_at)'
  );
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('reservation_public_checkout_tokens');
};
