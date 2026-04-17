'use strict';

const express = require('express');
const controller = require('./public-booking.controller');
const { idempotencyReservationCreate, idempotencyPaymentCreate } = require('../../middlewares/idempotency');
const {
  publicBookingReservationLimiter,
  publicBookingPaymentLimiter,
} = require('../../middlewares/public-booking-rate-limit');

const router = express.Router();

router.post(
  '/reservations',
  publicBookingReservationLimiter,
  idempotencyReservationCreate,
  controller.postPublicReservation
);

router.post(
  '/payments/create',
  publicBookingPaymentLimiter,
  idempotencyPaymentCreate,
  controller.postPublicPaymentCreate
);

module.exports = router;
