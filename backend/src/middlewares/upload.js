'use strict';

const multer = require('multer');

const imageMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const videoMime = new Set(['video/mp4', 'video/quicktime']);

const imageMaxBytes = Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024);
const videoMaxBytes = Number(process.env.UPLOAD_MAX_VIDEO_BYTES || 200 * 1024 * 1024);
/** Multer ceiling (video); imágenes se validan de nuevo en controller. */
const mediaMaxBytes = Math.max(imageMaxBytes, videoMaxBytes);

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: imageMaxBytes },
  fileFilter(req, file, cb) {
    if (imageMime.has(file.mimetype)) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image/jpeg, png, webp, gif'));
  },
});

/** Imagen o video (mp4/mov). Límite imagen 5MB por defecto, video 200MB (`UPLOAD_MAX_VIDEO_BYTES`). */
const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: mediaMaxBytes },
  fileFilter(req, file, cb) {
    if (imageMime.has(file.mimetype) || videoMime.has(file.mimetype)) return cb(null, true);
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Only image/jpeg, png, webp, gif or video/mp4, video/quicktime (mov)',
      ),
    );
  },
});

function singleImage(fieldName = 'file') {
  return (req, res, next) => {
    uploadImage.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: err.message || 'Invalid upload', details: null },
        });
      }
      return next(err);
    });
  };
}

function singleMedia(fieldName = 'file') {
  return (req, res, next) => {
    uploadMedia.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: err.message || 'Invalid upload', details: null },
        });
      }
      return next(err);
    });
  };
}

function enforceImageSizeLimit(req, res, next) {
  const f = req.file;
  if (!f || !f.mimetype.startsWith('image/')) return next();
  if (f.size > imageMaxBytes) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Image exceeds max size (${imageMaxBytes} bytes)`,
        details: null,
      },
    });
  }
  return next();
}

function enforceVideoSizeLimit(req, res, next) {
  const f = req.file;
  if (!f || !f.mimetype.startsWith('video/')) return next();
  if (f.size > videoMaxBytes) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Video exceeds max size (${videoMaxBytes} bytes)`,
        details: null,
      },
    });
  }
  return next();
}

module.exports = {
  uploadImage,
  uploadMedia,
  singleImage,
  singleMedia,
  enforceImageSizeLimit,
  enforceVideoSizeLimit,
  imageMaxBytes,
  videoMaxBytes,
};
