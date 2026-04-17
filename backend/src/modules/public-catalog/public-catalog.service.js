'use strict';

const roomsService = require('../rooms/rooms.service');
const plansService = require('../plans/plans.service');

async function listRoomsMarketing() {
  return roomsService.listPublic();
}

async function listPlansMarketing() {
  return plansService.listPublic();
}

module.exports = { listRoomsMarketing, listPlansMarketing };
