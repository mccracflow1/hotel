'use strict';

const express = require('express');
const reservationsController = require('./reservations.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const {
  idempotencyReservationCreate,
  idempotencyReservationUpdate,
  idempotencyReservationCancel,
  idempotencyReservationOptionalAdd,
} = require('../../middlewares/idempotency');

const router = express.Router();

const readRoles = ['VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN', 'AGENT'];
const writeReservationRoles = ['AGENT', 'ADMIN', 'BUSINESS'];

router.post(
  '/',
  authGuard,
  requireRoles('AGENT', 'ADMIN', 'BUSINESS'),
  idempotencyReservationCreate,
  reservationsController.createReservation
);

router.get('/', authGuard, requireRoles(...readRoles), reservationsController.listReservations);

router.get(
  '/by-number/:reservationNumber',
  authGuard,
  requireRoles(...readRoles),
  reservationsController.getReservationByNumber
);

router.get('/:id/policy', authGuard, requireRoles(...readRoles), reservationsController.getCancellationPolicy);

router.patch(
  '/:id/status',
  authGuard,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  reservationsController.patchReservationStatus
);

router.put(
  '/:id',
  authGuard,
  requireRoles(...writeReservationRoles),
  idempotencyReservationUpdate,
  reservationsController.updateReservationDates
);

router.delete(
  '/:id',
  authGuard,
  requireRoles(...writeReservationRoles),
  idempotencyReservationCancel,
  reservationsController.cancelReservation
);

router.post(
  '/:id/optional-activities',
  authGuard,
  requireRoles(...writeReservationRoles),
  idempotencyReservationOptionalAdd,
  reservationsController.addPostReservationOptionals
);

router.get('/:id', authGuard, requireRoles(...readRoles), reservationsController.getReservationById);

module.exports = router;
