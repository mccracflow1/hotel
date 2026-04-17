'use strict';

const express = require('express');
const plansController = require('./plans.controller');
const { authGuard, optionalAuth, requireRoles } = require('../../middlewares/auth.guard');

const router = express.Router();

router.get('/', optionalAuth, plansController.listPlans);

router.post('/', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), plansController.createPlan);

router.get('/:id', optionalAuth, plansController.getPlan);

router.post('/:id/media', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), plansController.postPlanMedia);
router.delete('/:id/media/:mediaId', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), plansController.deletePlanMedia);

router.patch('/:id', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), plansController.patchPlan);

router.post('/:id/activities/reorder', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), plansController.postReorder);

router.get(
  '/:id/activities/:activityId/delete-impact',
  authGuard,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  plansController.getDeleteImpact
);

router.delete(
  '/:id/activities/:activityId',
  authGuard,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  plansController.deleteActivity
);

router.post('/:id/clone', authGuard, requireRoles('ADMIN', 'SUPER_ADMIN'), plansController.postClone);

router.post(
  '/:id/optional-links',
  authGuard,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  plansController.postLinkOptional
);

router.delete(
  '/:id/optional-links/:optionalId',
  authGuard,
  requireRoles('ADMIN', 'SUPER_ADMIN'),
  plansController.deleteLinkOptional
);

module.exports = router;
