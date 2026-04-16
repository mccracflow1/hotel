'use strict';

const express = require('express');
const reservationsController = require('./reservations.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { idempotencyReservationCreate } = require('../../middlewares/idempotency');

const router = express.Router();

router.post(
  '/',
  authGuard,
  requireRoles('AGENT', 'ADMIN', 'BUSINESS'),
  idempotencyReservationCreate,
  reservationsController.createReservation
);

module.exports = router;
