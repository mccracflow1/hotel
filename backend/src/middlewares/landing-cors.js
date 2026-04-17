'use strict';

/**
 * CORS for browser landing → API. Uses `LANDING_URL` (no trailing slash) as allowed Origin.
 * Optional `CORS_EXTRA_ORIGINS` comma-separated for local previews (e.g. http://127.0.0.1:5500).
 */
function landingCorsMiddleware() {
  return function landingCors(req, res, next) {
    const originHeader = req.headers.origin;
    if (!originHeader) return next();

    const primary = (process.env.LANDING_URL || '').replace(/\/$/, '');
    const extras = String(process.env.CORS_EXTRA_ORIGINS || '')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean);
    const allowed = new Set([primary, ...extras].filter(Boolean));

    if (allowed.has(originHeader)) {
      res.setHeader('Access-Control-Allow-Origin', originHeader);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'false');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Idempotency-Key, Authorization, Cookie, X-Requested-With'
      );
      res.setHeader('Access-Control-Max-Age', '7200');
    }

    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  };
}

module.exports = { landingCorsMiddleware };
