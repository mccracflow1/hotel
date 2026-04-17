'use strict';

const express = require('express');
const controller = require('./media.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { singleMedia, enforceImageSizeLimit, enforceVideoSizeLimit } = require('../../middlewares/upload');
const { idempotencyMediaUpload } = require('../../middlewares/idempotency');

const router = express.Router();

const manage = [authGuard, requireRoles('ADMIN', 'SUPER_ADMIN')];

router.post(
  '/upload',
  ...manage,
  idempotencyMediaUpload,
  singleMedia('file'),
  enforceImageSizeLimit,
  enforceVideoSizeLimit,
  controller.postUpload,
);
router.get('/', ...manage, controller.getList);
router.get('/:id/usage', ...manage, controller.getUsage);
router.patch('/:id', ...manage, controller.patchMedia);
router.delete('/:id', ...manage, controller.deleteMedia);

module.exports = router;
