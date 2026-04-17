'use strict';

const logger = require('../utils/logger');

/**
 * Extra env checks for payments / storage (005). Keeps dev friction low.
 */
function validateOptionalEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  const missing = [];
  if (!process.env.MP_ACCESS_TOKEN) missing.push('MP_ACCESS_TOKEN');
  if (!process.env.MP_WEBHOOK_SECRET) missing.push('MP_WEBHOOK_SECRET');
  if (!process.env.API_URL) missing.push('API_URL');
  if (!process.env.LANDING_URL) missing.push('LANDING_URL');

  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  if (provider === 's3') {
    ['AWS_REGION', 'AWS_BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].forEach((k) => {
      if (!process.env[k]) missing.push(k);
    });
  }

  if (missing.length) {
    logger.logText('error', 'STARTUP FAILED: missing env for production', { missing });
    process.exit(1);
  }
}

module.exports = { validateOptionalEnv };
