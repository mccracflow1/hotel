'use strict';

const express = require('express');
const inventoryController = require('./inventory.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { idempotencyInventoryMovement } = require('../../middlewares/idempotency');

const router = express.Router();

router.get(
  '/items',
  authGuard,
  requireRoles('VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN', 'AGENT'),
  inventoryController.listItems
);
router.post('/items', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), inventoryController.createItem);
router.put('/items/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), inventoryController.updateItem);

router.get(
  '/items/:itemId/movements',
  authGuard,
  requireRoles('VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN', 'AGENT'),
  inventoryController.getMovements
);

router.post(
  '/movements',
  authGuard,
  requireRoles('BUSINESS', 'ADMIN', 'SUPER_ADMIN'),
  idempotencyInventoryMovement,
  inventoryController.postMovement
);

router.get(
  '/alerts',
  authGuard,
  requireRoles('VIEWER', 'BUSINESS', 'ADMIN', 'SUPER_ADMIN', 'AGENT'),
  inventoryController.getAlerts
);

module.exports = router;
