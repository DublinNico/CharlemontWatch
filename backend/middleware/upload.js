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
const isValidImageBuffer = (b) => {
  if (!b || b.length < 4) return false;
  const isJpeg = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
  const isPng  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isWebp = b.length >= 12 &&
                 b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                 b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return isJpeg || isPng || isWebp;
};

// Check actual file magic bytes — guards against files renamed to bypass the MIME check.
// Runs as a separate middleware after multer has buffered the file into memory.
// Validates ALL files in a multi-upload (req.files array), not just the first.
const validateMagicBytes = (req, res, next) => {
  const files = req.files?.length ? req.files : (req.file ? [req.file] : []);
  if (!files.length) return next();

  for (const file of files) {
    if (!isValidImageBuffer(file.buffer)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
  }

  next();
};

module.exports = { upload, validateMagicBytes };