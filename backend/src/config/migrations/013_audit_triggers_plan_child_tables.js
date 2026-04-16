/**
 * Migration 013: audit triggers on plan_activities, optional_activities, plan_optional_activities
 */
exports.up = async function (knex) {
  const tables = ['plan_activities', 'optional_activities', 'plan_optional_activities'];
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
  const tables = ['plan_activities', 'optional_activities', 'plan_optional_activities'];
  for (const tableName of tables) {
    await knex.raw(`DROP TRIGGER IF EXISTS audit_${tableName} ON ${tableName}`);
  }
};
