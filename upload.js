const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const POSTS_DIR = path.join(__dirname, 'public/uploads/posts');
const AVA_DIR   = path.join(__dirname, 'public/uploads/avatars');
[POSTS_DIR, AVA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm/;
function fileFilter(req, file, cb) {
  const ext  = ALLOWED.test(path.extname(file.originalname).toLowerCase());
  const mime = ALLOWED.test(file.mimetype);
  ext && mime ? cb(null, true) : cb(new Error('Only images and videos are allowed'));
}

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, POSTS_DIR),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVA_DIR),
  filename:    (req, file, cb) => {
    const userId = req.session?.userId ?? 'unknown';
    cb(null, `${userId}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload       = multer({ storage: postStorage,  limits: { fileSize: 50 * 1024 * 1024 }, fileFilter });
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5  * 1024 * 1024 }, fileFilter });

module.exports        = upload;
module.exports.avatar = uploadAvatar;
