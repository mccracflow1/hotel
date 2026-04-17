'use strict';

const fs = require('fs/promises');
const path = require('path');

function getBaseDir() {
  return path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || 'storage/public');
}

function publicBaseUrl() {
  const base = (process.env.PUBLIC_MEDIA_BASE_URL || process.env.API_URL || '').replace(/\/$/, '');
  return base ? `${base}/uploads` : '/uploads';
}

/**
 * @returns {{ originalUrl: string, thumbnailUrl: string | null }}
 */
async function saveOriginalAndThumb({ id, originalExt, originalBuffer, thumbBuffer }) {
  const root = getBaseDir();
  const originalsDir = path.join(root, 'originals');
  const thumbsDir = path.join(root, 'thumbnails');
  await fs.mkdir(originalsDir, { recursive: true });
  await fs.mkdir(thumbsDir, { recursive: true });

  const origName = `${id}${originalExt}`;
  const thumbName = `${id}.webp`;
  await fs.writeFile(path.join(originalsDir, origName), originalBuffer);
  let thumbnailUrl = null;
  if (thumbBuffer && thumbBuffer.length) {
    await fs.writeFile(path.join(thumbsDir, thumbName), thumbBuffer);
    thumbnailUrl = `${publicBaseUrl()}/thumbnails/${thumbName}`;
  }

  const originalUrl = `${publicBaseUrl()}/originals/${origName}`;
  return { originalUrl, thumbnailUrl };
}

async function removeFiles({ id, originalExt, hadThumbnail }) {
  const root = getBaseDir();
  const origPath = path.join(root, 'originals', `${id}${originalExt}`);
  const thumbPath = path.join(root, 'thumbnails', `${id}.webp`);
  await fs.unlink(origPath).catch(() => {});
  if (hadThumbnail) await fs.unlink(thumbPath).catch(() => {});
}

module.exports = { saveOriginalAndThumb, removeFiles, getBaseDir, publicBaseUrl };
