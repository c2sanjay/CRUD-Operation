const fs = require('fs');
const path = require('path');
const express = require('express');
const {
  upload,
  handleUploadErrors,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} = require('../middleware/upload');

const router = express.Router();

// Build the absolute URL a browser can use to load the stored file.
function publicUrl(req, filename) {
  const base =
    process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/uploads/${filename}`;
}

// GET /api/uploads/config - limits the client can validate against before sending
router.get('/config', (req, res) => {
  res.json({
    maxFileSize: MAX_FILE_SIZE,
    allowedMimeTypes: Object.keys(ALLOWED_MIME_TYPES),
  });
});

// POST /api/uploads - upload a single image (multipart/form-data, field: "file")
router.post('/', upload.single('file'), handleUploadErrors, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided in field "file"' });
  }
  res.status(201).json({
    url: publicUrl(req, req.file.filename),
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
});

// DELETE /api/uploads/:filename - remove a previously uploaded file
router.delete('/:filename', async (req, res) => {
  const { filename } = req.params;

  // Reject anything that is not a plain file name so "../" cannot escape
  // UPLOAD_DIR, then confirm the resolved path is still inside it.
  if (filename !== path.basename(filename)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  const target = path.resolve(UPLOAD_DIR, filename);
  if (path.relative(UPLOAD_DIR, target).startsWith('..')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  try {
    await fs.promises.unlink(target);
    res.json({ message: 'File deleted', filename });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ message: 'File not found' });
    }
    res.status(500).json({ message: 'Failed to delete file', error: err.message });
  }
});

module.exports = router;
