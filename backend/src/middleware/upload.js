const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// Absolute path to backend/uploads — created on boot so multer never fails on a
// missing destination.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Never trust the client filename on disk: keep a slug of it for readability
    // but generate the unique part ourselves, and take the extension from the
    // (validated) mime type so ".jpg.exe" style names cannot survive.
    const original = path.parse(file.originalname).name;
    const slug =
      original
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'image';
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${slug}-${unique}${ALLOWED_MIME_TYPES[file.mimetype]}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    const err = new Error(
      `Unsupported file type "${file.mimetype}". Allowed: ${Object.keys(
        ALLOWED_MIME_TYPES
      ).join(', ')}`
    );
    err.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

// Turns multer/filter errors into the same JSON shape the rest of the API uses.
function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB`
        : `Upload failed: ${err.message}`;
    return res.status(400).json({ message, code: err.code });
  }
  if (err && err.code === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(415).json({ message: err.message, code: err.code });
  }
  return next(err);
}

module.exports = {
  upload,
  handleUploadErrors,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
};
