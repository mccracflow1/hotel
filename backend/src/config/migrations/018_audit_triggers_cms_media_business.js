/**
 * Migration 018: triggers de auditoría (log_changes) en CMS, medios y business_config.
 *
 * Complementa 010 (tablas operativas) para cumplir constitución §IV en mutaciones
 * de site_content, faqs, business_config y media_library.
 */
exports.up = async function (knex) {
  const tables = ['media_library', 'site_content', 'faqs', 'business_config'];

  for (const tableName of tables) {
    await knex.raw(`
      DROP TRIGGER IF EXISTS audit_${tableName} ON ${tableName};
      CREATE TRIGGER audit_${tableName}
        AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
        FOR EACH ROW EXECUTE FUNCTION log_changes()
    `);
  }
};

exports.down = async function (knex) {
  const tables = ['media_library', 'site_content', 'faqs', 'business_config'];
  for (const tableName of tables) {
    await knex.raw(`DROP TRIGGER IF EXISTS audit_${tableName} ON ${tableName}`);
  }
};
