'use strict';

const express = require('express');
const usersController = require('./users.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

router.get('/me', authGuard, usersController.getMe);
router.patch('/me', authGuard, usersController.patchMe);

router.get('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), usersController.listUsers);
router.post('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), usersController.createUser);
router.patch(
  '/:id/status',
  authGuard,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  usersController.patchUserStatus,
);
router.put('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), usersController.updateUser);

module.exports = router;
