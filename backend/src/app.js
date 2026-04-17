require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./config/database');
const { errorHandler } = require('./middlewares/error-handler');
const logger = require('./utils/logger');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Medios locales: sirve `storage/public` (originals/, thumbnails/). Webhook MP usa JSON parseado
// aquí arriba; la firma HMAC toma `data.id` de query o body según mp-webhook.verify.
app.use('/uploads', express.static(path.join(__dirname, '..', 'storage', 'public')));

// Request logging
app.use((req, res, next) => {
  logger.logText('info', `${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ── Health Check ─────────────────────────────────────────────────────────────
// CONTEXTO_MAESTRO: GET /api/v1/health (también en /api/health para Railway)
app.get(['/api/health', '/api/v1/health'], async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  try {
    await db.raw('SELECT 1');
    dbStatus = 'CONNECTED';
  } catch {
    // El servidor responde UP aunque la BD no esté disponible momentáneamente
  }

  return res.status(200).json({
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  });
});

// ── Swagger UI ───────────────────────────────────────────────────────────────
try {
  const swaggerSetup = require('./config/swagger');
  swaggerSetup(app);
} catch {
  // Swagger es opcional en desarrollo
}

// ── Módulos de la API ─────────────────────────────────────────────────────────
app.use('/api/v1/auth',         require('./modules/auth/auth.routes'));
app.use('/api/v1/availability', require('./modules/availability/availability.routes'));
app.use('/api/v1/seasons',      require('./modules/seasons/seasons.routes'));
app.use('/api/v1/rooms', require('./modules/rooms/rooms.routes'));
app.use('/api/v1/plans', require('./modules/plans/plans.routes'));
app.use('/api/v1/optional-activities', require('./modules/plans/optional-activities.routes'));
app.use('/api/v1/reservations', require('./modules/reservations/reservations.routes'));
app.use('/api/v1/inventory', require('./modules/inventory/inventory.routes'));
app.use('/api/v1/suppliers', require('./modules/suppliers/suppliers.routes'));
app.use('/api/v1/users', require('./modules/users/users.routes'));
app.use('/api/v1/business-config', require('./modules/business-config/business-config.routes'));
app.use('/api/v1/reports', require('./modules/reports/reports.routes'));
app.use('/api/v1/payments', require('./modules/payments/payments.routes'));
app.use('/api/v1/media', require('./modules/media/media.routes'));
app.use('/api/v1/public', require('./modules/public-catalog/public-catalog.routes'));
app.use('/api/v1', require('./modules/cms/cms.routes'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Endpoint not found', details: null },
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
