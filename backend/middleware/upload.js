const multer = require('multer');

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Check actual file magic bytes — guards against files renamed to bypass the MIME check.
// Runs as a separate middleware after multer has buffered the file into memory.
const validateMagicBytes = (req, res, next) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) return next();

  const b = file.buffer;
  if (!b || b.length < 12) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  const isJpeg = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
  const isPng  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                 b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  next();
};

module.exports = { upload, validateMagicBytes };