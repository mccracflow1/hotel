'use strict';

/**
 * Sets PostgreSQL transaction-local GUC consumed by log_changes() (migration 014).
 * Call at the start of every Knex transaction that performs writes on audited tables
 * when an authenticated user is available (req.user.id).
 *
 * @param {import('knex').Knex.Transaction} trx
 * @param {string | null | undefined} userId - UUID of acting user, or null for system paths
 */
async function setAuditUserOnTrx(trx, userId) {
  const value = userId ? String(userId) : '';
  await trx.raw(`SELECT set_config('app.audit_user_id', ?, true)`, [value]);
}

module.exports = { setAuditUserOnTrx };
