'use strict';

const express = require('express');
const optionalActivitiesController = require('./optional-activities.controller');
const { authGuard, optionalAuth, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

router.get('/', optionalAuth, optionalActivitiesController.listOptional);

router.post('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), optionalActivitiesController.createOptional);

router.patch('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), optionalActivitiesController.patchOptional);

router.delete('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), optionalActivitiesController.deleteOptional);

module.exports = router;
