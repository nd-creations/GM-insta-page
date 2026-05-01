const multer = require('multer');
const path = require('path');
const fs = require('fs');

// correct folders
const POSTS_DIR = path.join(__dirname, 'public', 'uploads', 'posts');
const AVATAR_DIR = path.join(__dirname, 'public', 'uploads', 'avatars');

// create folders
[POSTS_DIR, AVATAR_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// allow files
function fileFilter(req, file, cb) {
  cb(null, true);
}

// post storage
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, POSTS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

// avatar storage
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

const post = multer({
  storage: postStorage,
  fileFilter
});

const avatar = multer({
  storage: avatarStorage,
  fileFilter
});

// CORRECT EXPORT
module.exports = {
  post,
  avatar
};
