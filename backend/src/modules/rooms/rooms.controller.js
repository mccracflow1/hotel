'use strict';

const roomsService = require('./rooms.service');
const { createRoomSchema, patchRoomSchema } = require('./rooms.schema');
const { ValidationError, ForbiddenError, NotFoundError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

function canManageRooms(user) {
  return user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
}

async function listRooms(req, res, next) {
  try {
    const query = { include_deleted: req.query.include_deleted === 'true' || req.query.include_deleted === '1' };
    if (canManageRooms(req.user)) {
      const data = await roomsService.listAdmin(query);
      return res.status(200).json({ data });
    }
    const data = await roomsService.listPublic();
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function getRoomById(req, res, next) {
  try {
    const includeDeleted = canManageRooms(req.user) && req.query.include_deleted === 'true';
    const row = await roomsService.getById(req.params.id, { includeDeleted });
    if (!row) {
      return next(new NotFoundError('Room not found'));
    }
    if (!row.is_active && !canManageRooms(req.user)) {
      return next(new NotFoundError('Room not found'));
    }
    if (row.deleted_at && !includeDeleted) {
      return next(new NotFoundError('Room not found'));
    }
    const roomsRepo = require('./rooms.repository');
    const out = await roomsRepo.hydrateMedia(row);
    return res.status(200).json({ data: out });
  } catch (err) {
    return next(err);
  }
}

async function createRoom(req, res, next) {
  try {
    if (!canManageRooms(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(createRoomSchema, req.body);
    const data = await roomsService.createRoom(body, req.user.id);
    return res.status(201).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function patchRoom(req, res, next) {
  try {
    if (!canManageRooms(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(patchRoomSchema, req.body);
    const data = await roomsService.updateRoom(req.params.id, body, req.user.id);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    if (!canManageRooms(req.user)) throw new ForbiddenError('FORBIDDEN');
    await roomsService.removeRoom(req.params.id, req.user.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listRooms,
  getRoomById,
  createRoom,
  patchRoom,
  deleteRoom,
};
