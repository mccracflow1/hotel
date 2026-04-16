const db = require('../config/database');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  query() {
    return this.db(this.tableName);
  }

  async findById(id) {
    return this.query().where({ id }).first();
  }

  async findAll(filters = {}) {
    return this.query().where(filters);
  }

  async create(data) {
    const [row] = await this.query().insert(data).returning('*');
    return row;
  }

  async update(id, data) {
    const [row] = await this.query().where({ id }).update(data).returning('*');
    return row;
  }

  async delete(id) {
    return this.query().where({ id }).delete();
  }

  /**
   * Execute a callback within a transaction.
   * Usage: await repo.transaction(async (trx) => { ... });
   */
  async transaction(callback) {
    return this.db.transaction(callback);
  }

  /**
   * Execute query with pessimistic locking: SELECT FOR UPDATE SKIP LOCKED.
   */
  async findForUpdate(filters = {}, trx) {
    const q = (trx ? trx(this.tableName) : this.query()).where(filters).forUpdate().skipLocked();
    return q;
  }
}

module.exports = BaseRepository;
