'use strict';

const Joi = require('joi');

const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,128}$/;

const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(128).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().uuid().required(),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.',
  }),
});

module.exports = { loginSchema, forgotPasswordSchema, resetPasswordSchema };
