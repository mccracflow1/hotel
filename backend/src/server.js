const app = require('./app');
const logger = require('./utils/logger');
const { validateOptionalEnv } = require('./config/validate-env');

// ── NFR-004: JWT secrets must be at least 64 characters ──────────────────────
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

if (JWT_SECRET.length < 64) {
  logger.logText('error', 'STARTUP FAILED: JWT_SECRET must be at least 64 characters (NFR-004)', {
    currentLength: JWT_SECRET.length,
  });
  process.exit(1);
}

if (JWT_REFRESH_SECRET.length < 64) {
  logger.logText('error', 'STARTUP FAILED: JWT_REFRESH_SECRET must be at least 64 characters (NFR-004)', {
    currentLength: JWT_REFRESH_SECRET.length,
  });
  process.exit(1);
}

validateOptionalEnv();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.logText('info', 'Hotel API started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    docs: `http://localhost:${PORT}/api/docs`,
    health: `http://localhost:${PORT}/api/v1/health`,
  });
});
