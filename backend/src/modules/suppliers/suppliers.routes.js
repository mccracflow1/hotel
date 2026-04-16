'use strict';

const express = require('express');
const c = require('./suppliers.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

router.get('/', authGuard, requireRoles('VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN'), c.list);
router.post('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), c.create);
router.put('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), c.update);

module.exports = router;
