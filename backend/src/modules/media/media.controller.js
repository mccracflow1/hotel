'use strict';

const mediaService = require('./media.service');

async function postUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'file is required', details: null },
      });
    }
    const data = await mediaService.uploadImage({
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

async function deleteMedia(req, res, next) {
  try {
    await mediaService.removeMedia(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { postUpload, getList, deleteMedia };
