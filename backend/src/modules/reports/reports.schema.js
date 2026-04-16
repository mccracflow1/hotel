'use strict';

const Joi = require('joi');

const dateRangeSchema = Joi.object({
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  granularity: Joi.string().valid('day', 'week', 'month').default('day'),
});

module.exports = { dateRangeSchema };
