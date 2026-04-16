'use strict';

const express = require('express');
const c = require('./reports.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

const readers = ['VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN', 'AGENT'];

router.get('/occupancy', authGuard, requireRoles(...readers), c.occupancy);
router.get('/revenue', authGuard, requireRoles(...readers), c.revenue);
router.get('/reservations', authGuard, requireRoles(...readers), c.reservations);
router.get('/inventory', authGuard, requireRoles(...readers), c.inventory);

module.exports = router;
