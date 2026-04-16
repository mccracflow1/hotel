'use strict';

const db = require('../../config/database');
const { NotFoundError } = require('../../middlewares/error-handler');

async function list() {
  const rows = await db('suppliers').where({ is_active: true }).orderBy('name', 'asc');
  return { data: rows };
}

async function create(payload) {
  const [row] = await db('suppliers').insert(payload).returning('*');
  return { data: row };
}

async function update(id, payload) {
  const ex = await db('suppliers').where({ id }).first();
  if (!ex) throw new NotFoundError('Supplier not found');
  const [row] = await db('suppliers').where({ id }).update(payload).returning('*');
  return { data: row };
}

module.exports = { list, create, update };
