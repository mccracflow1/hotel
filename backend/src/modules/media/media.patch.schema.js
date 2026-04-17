'use strict';

const Joi = require('joi');

const patchMediaSchema = Joi.object({
  filename: Joi.string().min(1).max(255).required(),
});

module.exports = { patchMediaSchema };
