'use strict';

const express = require('express');
const roomsController = require('./rooms.controller');
const { authGuard, optionalAuth, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

router.get('/', optionalAuth, roomsController.listRooms);

router.post('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), roomsController.createRoom);

router.get('/:id', optionalAuth, roomsController.getRoomById);

router.patch('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), roomsController.patchRoom);

router.delete('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), roomsController.deleteRoom);

module.exports = router;
