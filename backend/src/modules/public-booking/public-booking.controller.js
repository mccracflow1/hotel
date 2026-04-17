'use strict';

const reservationsService = require('../reservations/reservations.service');
const paymentsService = require('../payments/payments.service');
const { createReservationSchema, publicPaymentCreateSchema } = require('./public-booking.schema');
const { ValidationError } = require('../../middlewares/error-handler');
const publicBookingRepo = require('./public-booking.repository');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function postPublicReservation(req, res, next) {
  try {
    const body = validate(createReservationSchema, req.body);
    const row = await reservationsService.createReservation(body, null);
    const payment_intent_token = await publicBookingRepo.insertCheckoutToken(row.id);
    return res.status(201).json({
      data: {
        id: row.id,
        reservation_number: row.reservation_number,
        status: row.status,
        total_amount: row.total_amount != null ? Number(row.total_amount) : row.total_amount,
        plan_id: row.plan_id,
        room_id: row.room_id,
        payment_intent_token,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function postPublicPaymentCreate(req, res, next) {
  try {
    const body = validate(publicPaymentCreateSchema, req.body);
    const ok = await publicBookingRepo.validateCheckoutToken(body.reservation_id, body.payment_intent_token);
    if (!ok) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Invalid or expired checkout token', details: null },
      });
    }
    const idempotencyKey = req.headers['idempotency-key'];
    const data = await paymentsService.createCheckoutPreference({
      reservationId: body.reservation_id,
      amount: body.amount,
      idempotencyKey,
    });
    await publicBookingRepo.deleteTokensForReservation(body.reservation_id);
    return res.status(201).json({ data });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  postPublicReservation,
  postPublicPaymentCreate,
};
