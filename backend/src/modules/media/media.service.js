'use strict';

const path = require('path');
const sharp = require('sharp');
const { randomUUID } = require('crypto');
const db = require('../../config/database');
const repo = require('./media.repository');
const { createStorage } = require('./storage');
const { ConflictError, NotFoundError } = require('../../middlewares/error-handler');

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

async function removeMedia(id) {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('Media not found');

  return db.transaction(async (trx) => {
    const refs = await repo.countRefs(trx, id);
    if (refs > 0) {
      throw new ConflictError('Media is in use (room, plan, optional activity, or site content)');
    }
    await repo.deleteById(trx, id);
    const storage = createStorage();
    const ext = path.extname(row.filename) || '.jpg';
    await storage.removeFiles({ id, originalExt: ext, hadThumbnail: !!row.thumbnail_url });
  });
}

module.exports = { uploadImage, listLibrary, removeMedia };
