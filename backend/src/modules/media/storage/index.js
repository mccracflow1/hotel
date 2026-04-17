'use strict';

/**
 * @returns {typeof import('./local')}
 */
function createStorage() {
  const p = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  if (p === 's3') return require('./s3');
  return require('./local');
}

module.exports = { createStorage };
