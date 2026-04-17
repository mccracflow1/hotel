'use strict';

const roomsService = require('./rooms.service');
const db = require('../../config/database');
const roomsRepo = require('./rooms.repository');
const { createRoomSchema, patchRoomSchema, linkRoomMediaSchema } = require('./rooms.schema');
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

async function postRoomMedia(req, res, next) {
  try {
    if (!canManageRooms(req.user)) throw new ForbiddenError('FORBIDDEN');
    const body = validate(linkRoomMediaSchema, req.body);
    await db.transaction(async (trx) => {
      const room = await trx('rooms').where({ id: req.params.id }).whereNull('deleted_at').first();
      if (!room) throw new NotFoundError('Room not found');
      const m = await trx('media_library').where({ id: body.media_id }).first();
      if (!m) throw new NotFoundError('Media not found');
      await roomsRepo.linkRoomMedia(trx, req.params.id, body.media_id, {
        is_cover: body.is_cover,
        sort_order: body.sort_order,
      });
    });
    return res.status(201).json({ data: { room_id: req.params.id, media_id: body.media_id } });
  } catch (err) {
    return next(err);
  }
}

async function deleteRoomMedia(req, res, next) {
  try {
    if (!canManageRooms(req.user)) throw new ForbiddenError('FORBIDDEN');
    const n = await db.transaction((trx) =>
      roomsRepo.unlinkRoomMedia(trx, req.params.id, req.params.mediaId)
    );
    if (!n) return next(new NotFoundError('Association not found'));
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
  postRoomMedia,
  deleteRoomMedia,
};
