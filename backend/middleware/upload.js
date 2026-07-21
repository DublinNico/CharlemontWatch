const multer = require('multer');

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

// Thrown by fileFilter/validateMagicBytes on an unsupported format — a
// distinct type so app.js's error handler can tell it apart from unexpected
// failures and respond 400 with a real message instead of a generic 500.
class UnsupportedFileTypeError extends Error {}

const UNSUPPORTED_FILE_MESSAGE = 'Photos must be JPEG, PNG, or WebP. If you\'re on an iPhone, HEIC photos aren\'t supported yet — switch to "Most Compatible" under Settings > Camera > Formats, or choose "Use Original" when picking the photo.';

// First-pass filter based on the declared MIME type — cheap but
// spoofable, so it's backed up by validateMagicBytes below
const fileFilter = (req, file, cb) => {
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new UnsupportedFileTypeError(UNSUPPORTED_FILE_MESSAGE));
  }
  cb(null, true);
};

// Multer instance used by the upload routes — buffers files in memory
// (rather than disk) since they're forwarded straight to S3, capped at 5MB each
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Reads the first few bytes of a buffer and checks them against known image
// file signatures, regardless of what the declared MIME type claimed
const isValidImageBuffer = (b) => {
  if (!b || b.length < 4) return false;
  const isJpeg = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
  const isPng  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isWebp = b.length >= 12 &&
                 b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                 b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return isJpeg || isPng || isWebp;
};

// Checks actual file magic bytes — guards against files renamed to bypass the
// MIME check. Runs as a separate middleware after multer has buffered the
// file(s) into memory, validating every file in a multi-upload, not just the first.
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

module.exports = { upload, validateMagicBytes, UnsupportedFileTypeError };
