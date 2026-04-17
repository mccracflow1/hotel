'use strict';

const express = require('express');
const controller = require('./cms.controller');
const { authGuard, requireRoles } = require('../../middlewares/auth.guard');
const { idempotencyCmsSiteContentPut } = require('../../middlewares/idempotency');

const router = express.Router();

const cmsAdmin = [authGuard, requireRoles('ADMIN', 'SUPER_ADMIN')];

router.get('/site-content/public', controller.getPublicBundle);
router.get('/site-content/:section', ...cmsAdmin, controller.getSection);
router.put('/site-content/:section', ...cmsAdmin, idempotencyCmsSiteContentPut, controller.putSection);

router.get('/faqs', controller.getFaqsPublic);
router.get('/faqs/manage', ...cmsAdmin, controller.getFaqsManage);
router.post('/faqs', ...cmsAdmin, controller.postFaq);
router.put('/faqs/reorder', ...cmsAdmin, controller.putFaqsReorder);
router.put('/faqs/:id', ...cmsAdmin, controller.putFaq);
router.delete('/faqs/:id', ...cmsAdmin, controller.deleteFaq);

module.exports = router;
