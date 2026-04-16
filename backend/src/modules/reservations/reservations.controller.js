'use strict';

const reservationsService = require('./reservations.service');
const {
  createReservationSchema,
  listReservationsQuerySchema,
  patchStatusSchema,
  updateDatesSchema,
  cancelBodySchema,
  addOptionalSchema,
  reservationNumberParamSchema,
} = require('./reservations.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function createReservation(req, res, next) {
  try {
    const body = validate(createReservationSchema, req.body);
    const row = await reservationsService.createReservation(body, req.user.id);
    return res.status(201).json({
      data: {
        id: row.id,
        reservation_number: row.reservation_number,
        status: row.status,
        total_amount: row.total_amount != null ? Number(row.total_amount) : row.total_amount,
        plan_id: row.plan_id,
        room_id: row.room_id,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listReservations(req, res, next) {
  try {
    const q = validate(listReservationsQuerySchema, {
      ...req.query,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    const { page, limit, ...filters } = q;
    const result = await reservationsService.listReservations(filters, page, limit);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function getReservationById(req, res, next) {
  try {
    const result = await reservationsService.getReservationDetail(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function getReservationByNumber(req, res, next) {
  try {
    validate(reservationNumberParamSchema, req.params);
    const result = await reservationsService.getReservationByNumber(req.params.reservationNumber);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function getCancellationPolicy(req, res, next) {
  try {
    const result = await reservationsService.getCancellationPolicyForReservation(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function patchReservationStatus(req, res, next) {
  try {
    const body = validate(patchStatusSchema, req.body);
    const result = await reservationsService.patchReservationStatus(
      req.params.id,
      body.status,
      req.user.id,
      req.user.role
    );
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function updateReservationDates(req, res, next) {
  try {
    const body = validate(updateDatesSchema, req.body);
    const result = await reservationsService.updateReservationDates(req.params.id, body, req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const body = validate(cancelBodySchema, req.body);
    const result = await reservationsService.cancelReservation(
      req.params.id,
      body.cancellation_reason,
      req.user.id
    );
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function addPostReservationOptionals(req, res, next) {
  try {
    const body = validate(addOptionalSchema, req.body);
    const result = await reservationsService.addPostReservationOptionals(req.params.id, body, req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createReservation,
  listReservations,
  getReservationById,
  getReservationByNumber,
  getCancellationPolicy,
  patchReservationStatus,
  updateReservationDates,
  cancelReservation,
  addPostReservationOptionals,
};
