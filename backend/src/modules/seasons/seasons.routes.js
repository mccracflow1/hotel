'use strict';

const express = require('express');
const seasonsController = require('./seasons.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

// GET /api/v1/seasons — requiere autenticación (VIEWER+)
router.get('/', authGuard, requireRoles('VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN'), seasonsController.findAll);

// GET /api/v1/seasons/:id — requiere autenticación (VIEWER+)
router.get('/:id', authGuard, requireRoles('VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN'), seasonsController.findById);

// POST /api/v1/seasons — solo ADMIN/SUPER_ADMIN
router.post('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), seasonsController.create);

// PUT /api/v1/seasons/:id — solo ADMIN/SUPER_ADMIN
router.put('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), seasonsController.update);

// DELETE /api/v1/seasons/:id — solo ADMIN/SUPER_ADMIN
router.delete('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), seasonsController.delete);

module.exports = router;
