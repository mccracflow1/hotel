'use strict';

const express = require('express');
const controller = require('./payments.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { idempotencyPaymentCreate } = require('../../middlewares/idempotency');

const router = express.Router();

router.post('/webhook', controller.postWebhook);

router.post('/create', authGuard, requireRoles('ADMIN', 'AGENT'), idempotencyPaymentCreate, controller.createPayment);

router.get('/reconciliation', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), controller.getReconciliation);

module.exports = router;
