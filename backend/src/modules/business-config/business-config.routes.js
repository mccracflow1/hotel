'use strict';

const express = require('express');
const c = require('./business-config.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { idempotencyBusinessConfigPut } = require('../../middlewares/idempotency');

const router = express.Router();

router.get('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), c.getConfig);
router.put('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), idempotencyBusinessConfigPut, c.putConfig);

module.exports = router;
