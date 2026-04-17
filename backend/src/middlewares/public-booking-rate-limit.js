'use strict';

const rateLimit = require('express-rate-limit');

const publicBookingReservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PUBLIC_BOOKING_RESERVE_MAX || 40),
  standardHeaders: true,
  legacyHeaders: false,
});

const publicBookingPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PUBLIC_BOOKING_PAYMENT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  publicBookingReservationLimiter,
  publicBookingPaymentLimiter,
};
