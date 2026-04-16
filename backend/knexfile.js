require('dotenv').config();

const base = {
  client: 'pg',
  migrations: {
    directory: './src/config/migrations',
    tableName: 'knex_migrations',
  },
};

module.exports = {
  development: {
    ...base,
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    debug: false,
  },
  test: {
    ...base,
    connection: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    pool: { min: 1, max: 5 },
  },
  production: {
    ...base,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Railway requiere SSL
    },
    pool: { min: 2, max: 20 },
  },
};
