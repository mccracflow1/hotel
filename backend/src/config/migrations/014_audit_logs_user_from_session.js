/**
 * Migration 014: audit_logs.user_id from transaction-local GUC
 *
 * Services must call set_config('app.audit_user_id', '<uuid>', true) on the same
 * Knex transaction before INSERT/UPDATE/DELETE on audited tables (see audit-context.js).
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_changes() RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, user_id)
      VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END,
        (NULLIF(current_setting('app.audit_user_id', true), ''))::uuid
      );
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_changes() RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data)
      VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END
      );
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql
  `);
};
