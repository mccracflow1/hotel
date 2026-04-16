'use strict';

const express = require('express');
const availabilityController = require('./availability.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

// GET /api/v1/availability — endpoint público (landing page y agente IA sin auth)
router.get('/', availabilityController.getAvailability);

// GET /api/v1/availability/calendar — requiere autenticación (VIEWER+)
router.get('/calendar', authGuard, requireRoles('VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN'), availabilityController.getCalendar);

// POST /api/v1/availability — configurar cupos (ADMIN, SUPER_ADMIN, BUSINESS)
router.post('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN', 'BUSINESS'), availabilityController.configureSlots);

// POST /api/v1/availability/block — bloquear fechas (solo ADMIN/SUPER_ADMIN)
router.post('/block', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), availabilityController.blockDates);

module.exports = router;
