'use strict';

const publicCatalogService = require('./public-catalog.service');

async function getRooms(req, res, next) {
  try {
    const data = await publicCatalogService.listRoomsMarketing();
    return res.status(200).json({ data });
  } catch (e) {
    return next(e);
  }
}

async function getPlans(req, res, next) {
  try {
    const data = await publicCatalogService.listPlansMarketing();
    return res.status(200).json({ data });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getRooms, getPlans };
