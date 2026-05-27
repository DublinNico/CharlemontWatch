const multer = require('multer');

// Validate file type and size
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB per photo
  
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP allowed'));
  }
  
  if (file.size > maxSize) {
    return cb(new Error('Photo must be under 5MB'));
  }
  
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;