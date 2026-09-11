const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// One directory per kind of upload, so files stay easy to reason about.
const DIRS = {
  image: path.join(UPLOADS_ROOT, 'event-images'),
  qrImage: path.join(UPLOADS_ROOT, 'qr-uploads'),
  avatar: path.join(UPLOADS_ROOT, 'avatars')
};

for (const dir of [UPLOADS_ROOT, ...Object.values(DIRS), path.join(UPLOADS_ROOT, 'qr')]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIRS[file.fieldname] || DIRS.image),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|jpg|webp)$/.test(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only JPEG, PNG and WebP images are allowed'), { status: 400 }), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/** Cover image plus an optional ready-made QR code, on one request. */
const eventUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'qrImage', maxCount: 1 }
]);

module.exports = upload;
module.exports.eventUpload = eventUpload;
