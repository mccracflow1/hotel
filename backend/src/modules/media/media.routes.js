'use strict';

const express = require('express');
const controller = require('./media.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { singleImage } = require('../../middlewares/upload');

const router = express.Router();

const manage = [authGuard, requireRoles('ADMIN', 'SUPER_ADMIN')];

router.post('/upload', ...manage, singleImage('file'), controller.postUpload);
router.get('/', ...manage, controller.getList);
router.delete('/:id', ...manage, controller.deleteMedia);

module.exports = router;
