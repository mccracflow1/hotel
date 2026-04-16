'use strict';

const authService = require('./auth.service');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

const authController = {
  async login(req, res, next) {
    try {
      const body = validate(loginSchema, req.body);
      const result = await authService.login(body.email, body.password, res);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.cookies.refreshToken, res);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const result = await authService.refresh(req.cookies.refreshToken, res);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const body = validate(forgotPasswordSchema, req.body);
      await authService.forgotPassword(body.email);
      // Siempre responde 200 — no revelar si el email existe
      return res.status(200).json({
        message: 'Si el correo existe en nuestro sistema, recibirás instrucciones en breve.',
      });
    } catch (err) {
      return next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const body = validate(resetPasswordSchema, req.body);
      await authService.resetPassword(body.token, body.newPassword);
      return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      return next(err);
    }
  },

  async generateAgentToken(req, res, next) {
    try {
      const token = await authService.generateAgentToken();
      return res.status(200).json({ token });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = authController;
