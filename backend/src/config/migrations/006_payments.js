/**
 * Migration 006: payment_attempts, payments, idempotency_keys
 */
exports.up = async function (knex) {
  // payment_attempts: cada intento de pago (puede haber varios por reserva)
  await knex.schema.createTable('payment_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('reservation_id')
      .notNullable()
      .references('id')
      .inTable('reservations')
      .onDelete('RESTRICT');
    // SHA256(reservation_id + amount + 'COP') — garantiza un solo intento por operación
    table.string('idempotency_key', 128).notNullable().unique();
    table.string('preference_id', 100).nullable();
    table.text('checkout_url').nullable();
    table.string('status', 30).notNullable().defaultTo('pending');
    table.timestamp('expires_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // payments: pagos CONFIRMADOS (un registro definitivo por reserva confirmada)
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('reservation_id')
      .notNullable()
      .references('id')
      .inTable('reservations')
      .onDelete('RESTRICT');
    table.decimal('amount', 12, 2).notNullable();
    table.specificType('currency', 'char(3)').notNullable().defaultTo('COP');
    table.string('payment_method', 50).nullable(); // 'mercadopago_checkout', 'pse', 'manual'
    table.string('external_id', 100).nullable();   // ID del pago en MercadoPago
    table.string('status', 30).notNullable();       // 'confirmed', 'refunded', 'partial_refund'
    table.timestamp('confirmed_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // idempotency_keys: prevención de operaciones duplicadas en reservas y pagos
  await knex.schema.createTable('idempotency_keys', (table) => {
    table.string('key', 128).primary();
    table.string('operation', 60).notNullable();
    table.smallint('response_status').nullable();
    table.jsonb('response_body').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // TTL 24 horas; pg_cron limpia cada hora las expiradas
    table
      .timestamp('expires_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.raw("NOW() + INTERVAL '24 hours'"));
  });

  // Índice sobre expires_at para búsqueda rápida y cleanup por job programado.
  // No se usa WHERE expires_at > NOW() porque NOW() no es IMMUTABLE
  // y PostgreSQL no permite funciones volátiles en predicados de índice.
  await knex.raw(`
    CREATE INDEX idx_idempotency_expires
      ON idempotency_keys (expires_at)
  `);

  await knex.schema.table('payment_attempts', (table) => {
    table.index('reservation_id');
  });

  await knex.schema.table('payments', (table) => {
    table.index('reservation_id');
    table.index('external_id');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('idempotency_keys');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('payment_attempts');
};
