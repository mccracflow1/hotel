require('dotenv').config();

const base = {
  client: 'pg',
  migrations: {
    directory: './src/config/migrations',
    tableName: 'knex_migrations',
  },
};

/**
 * Construye el objeto de conexión según el entorno.
 * - Docker local / Railway: DATABASE_URL sin SSL
 * - Railway producción:     DATABASE_URL con SSL (rejectUnauthorized: false)
 *
 * La variable DATABASE_URL se inyecta vía docker-compose (services.backend.environment)
 * o vía el plugin PostgreSQL de Railway.
 */
function buildConnection(withSsl = false) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no está definida');
  if (!withSsl) return url;
  return { connectionString: url, ssl: { rejectUnauthorized: false } };
}

module.exports = {
  development: {
    ...base,
    connection: buildConnection(false),
    pool: { min: 2, max: 10 },
    debug: false,
  },
  test: {
    ...base,
    connection: process.env.DATABASE_URL_TEST
      ? buildConnection(false)
      : buildConnection(false),
    pool: { min: 1, max: 5 },
  },
  production: {
    ...base,
    // En Railway el certificado es auto-firmado; en Docker local no se necesita SSL
    connection: buildConnection(process.env.REQUIRE_SSL === 'true'),
    pool: { min: 2, max: 20 },
  },
};
