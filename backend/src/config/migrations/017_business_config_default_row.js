/**
 * Una fila por defecto para business_config (políticas y horarios editables vía API).
 */
exports.up = async function (knex) {
  const n = await knex('business_config').count('id as c').first();
  if (Number(n?.c || 0) === 0) {
    await knex('business_config').insert({
      hotel_name: 'Hotel',
      cancellation_policy: [
        { hours_before: 72, penalty_pct: 0 },
        { hours_before: 24, penalty_pct: 50 },
      ],
    });
  }
};

exports.down = async function () {
  // no-op: no borrar datos de negocio
};
