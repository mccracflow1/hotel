'use strict';

const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
  const passwordHash = await bcrypt.hash('Admin2026!', 12);

  await knex('users')
    .insert({
      email: 'admin@hotel.com',
      password_hash: passwordHash,
      name: 'Administrador',
      role: 'SUPER_ADMIN',
      is_active: true,
    })
    .onConflict('email')
    .ignore();
};
