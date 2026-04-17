'use strict';

const mediaService = require('./media.service');
const { patchMediaSchema } = require('./media.patch.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function postUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'file is required', details: null },
      });
    }
    const data = await mediaService.uploadMedia({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      userId: req.user?.id,
    });
    return res.status(201).json({ data });
  } catch (err) {
    if (err.code === 'S3_DEPENDENCY_MISSING' || err.code === 'S3_CONFIG') {
      return res.status(503).json({
        error: { code: 'SERVICE_UNAVAILABLE', message: err.message, details: null },
      });
    }
    return next(err);
  }
}

async function getList(req, res, next) {
  try {
    const { rows, total } = await mediaService.listLibrary(req.query);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    return res.status(200).json({ data: rows, meta: { page, limit, total } });
  } catch (err) {
    return next(err);
  }
}

async function getUsage(req, res, next) {
  try {
    const data = await mediaService.getUsage(req.params.id);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function patchMedia(req, res, next) {
  try {
    const body = validate(patchMediaSchema, req.body);
    const data = await mediaService.patchFilename(req.params.id, body.filename, req.user?.id);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function deleteMedia(req, res, next) {
  try {
    await mediaService.removeMedia(req.params.id, req.user?.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { postUpload, getList, getUsage, patchMedia, deleteMedia };
