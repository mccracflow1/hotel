#!/bin/sh
set -e

echo "[entrypoint] Ejecutando migraciones de base de datos..."
node node_modules/.bin/knex migrate:latest --knexfile knexfile.js

echo "[entrypoint] Migraciones completadas. Iniciando servidor..."
exec node src/server.js
