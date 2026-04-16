'use strict';

/**
 * @param {string} input
 * @returns {string}
 */
function toSlug(input) {
  if (!input || typeof input !== 'string') return 'item';
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

module.exports = { toSlug };
