'use strict';

const express = require('express');
const controller = require('./public-catalog.controller');

const router = express.Router();

router.get('/rooms', controller.getRooms);
router.get('/plans', controller.getPlans);

module.exports = router;
