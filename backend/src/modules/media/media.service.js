'use strict';

const path = require('path');
const sharp = require('sharp');
const { randomUUID } = require('crypto');
const db = require('../../config/database');
const repo = require('./media.repository');
const { createStorage } = require('./storage');
const { ConflictError, NotFoundError } = require('../../middlewares/error-handler');
const { setAuditUserOnTrx } = require('../../utils/audit-context');

async function uploadImage({ buffer, mimetype, originalname, userId }) {
  const id = randomUUID();
  const ext = path.extname(originalname || '') || (mimetype === 'image/png' ? '.png' : '.jpg');
  let thumb = null;
  if (mimetype.startsWith('image/')) {
    thumb = await sharp(buffer).rotate().resize({ width: 400 }).webp({ quality: 82 }).toBuffer();
  }
  const storage = createStorage();
  const { originalUrl, thumbnailUrl } = await storage.saveOriginalAndThumb({
    id,
    originalExt: ext,
    originalBuffer: buffer,
    thumbBuffer: thumb,
    contentType: mimetype,
  });

  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const row = await repo.insertMedia(trx, {
      id,
      filename: originalname || `upload${ext}`,
      original_url: originalUrl,
      thumbnail_url: thumbnailUrl,
      file_type: 'image',
      mime_type: mimetype,
      size_bytes: buffer.length,
      uploaded_by: userId || null,
    });
    return row;
  });
}

async function uploadVideo({ buffer, mimetype, originalname, userId }) {
  const id = randomUUID();
  const ext =
    path.extname(originalname || '') || (mimetype === 'video/quicktime' ? '.mov' : '.mp4');
  const storage = createStorage();
  const { originalUrl, thumbnailUrl } = await storage.saveOriginalAndThumb({
    id,
    originalExt: ext,
    originalBuffer: buffer,
    thumbBuffer: null,
    contentType: mimetype,
  });

  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const row = await repo.insertMedia(trx, {
      id,
      filename: originalname || `upload${ext}`,
      original_url: originalUrl,
      thumbnail_url: thumbnailUrl,
      file_type: 'video',
      mime_type: mimetype,
      size_bytes: buffer.length,
      uploaded_by: userId || null,
    });
    return row;
  });
}

async function uploadMedia(opts) {
  if (opts.mimetype.startsWith('video/')) {
    return uploadVideo(opts);
  }
  return uploadImage(opts);
}

async function listLibrary(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
  return repo.list({
    q: query.q,
    file_type: query.file_type,
    page,
    limit,
  });
}

async function getUsage(id) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('Media not found');
  return repo.listUsageDetails(db, id);
}

async function patchFilename(id, filename, userId) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('Media not found');
  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    return repo.patchFilename(trx, id, filename);
  });
}

async function removeMedia(id, userId) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('Media not found');

  return db.transaction(async (trx) => {
    await setAuditUserOnTrx(trx, userId);
    const usage = await repo.listUsageDetails(trx, id);
    if (usage.total > 0) {
      throw new ConflictError('Media is in use', usage);
    }
    await repo.deleteById(trx, id);
    const storage = createStorage();
    const ext = path.extname(row.filename) || '.jpg';
    await storage.removeFiles({ id, originalExt: ext, hadThumbnail: !!row.thumbnail_url });
  });
}

module.exports = { uploadImage, uploadMedia, uploadVideo, listLibrary, removeMedia, getUsage, patchFilename };
