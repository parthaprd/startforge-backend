const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    return cb(null, true);
  }
  return cb(
    new ApiError(
      400,
      `Unsupported file type: ${file.mimetype}. Allowed: jpg, jpeg, png, gif, webp.`
    )
  );
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const wrapMulter = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File too large. Maximum allowed size is 5MB.'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(
        new ApiError(400, `Unexpected field name. Use the 'image' field.`)
      );
    }
    return next(err);
  });
};

const uploadImage = wrapMulter(upload.single('image'));

module.exports = {
  upload,
  uploadImage,
  MAX_FILE_SIZE,
  ALLOWED_MIME,
};
