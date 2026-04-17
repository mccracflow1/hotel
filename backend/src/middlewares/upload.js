'use strict';

const multer = require('multer');

const imageMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024) },
  fileFilter(req, file, cb) {
    if (imageMime.has(file.mimetype)) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image/jpeg, png, webp, gif'));
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

module.exports = { uploadImage, singleImage };
