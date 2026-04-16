'use strict';

const reservationsService = require('./reservations.service');
const { createReservationSchema } = require('./reservations.schema');
const { ValidationError, ForbiddenError } = require('../../middlewares/error-handler');

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

module.exports = {
  createReservation,
};
