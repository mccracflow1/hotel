'use strict';

const express = require('express');
const authController = require('./auth.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { authLimiter } = require('../../middlewares/rate-limit');

const router = express.Router();

// POST /api/v1/auth/login — rate limited, solo cuenta intentos fallidos
router.post('/login', authLimiter, authController.login);

// POST /api/v1/auth/logout — requiere token válido
router.post('/logout', authGuard, authController.logout);

// POST /api/v1/auth/refresh — lee refresh token de cookie httpOnly
router.post('/refresh', authController.refresh);

// POST /api/v1/auth/forgot-password — siempre 200, no revela existencia de email
router.post('/forgot-password', authController.forgotPassword);

// POST /api/v1/auth/reset-password — token temporal de 1 hora
router.post('/reset-password', authController.resetPassword);

// POST /api/v1/auth/agent-token — solo SUPER_ADMIN puede generar token para n8n
router.post('/agent-token', authGuard, requireRoles('SUPER_ADMIN'), authController.generateAgentToken);

module.exports = router;
