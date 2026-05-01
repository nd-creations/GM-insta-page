require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const fs = require('fs');

const app = express();

// Create upload folders
['public/uploads/posts', 'public/uploads/avatars'].forEach(d => {
  const full = path.join(__dirname, d);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    console.log('📁 Created:', full);
  }
});

// Correct MongoDB URL
const MONGO_URI =
  'mongodb://testuser:Test1234@ac-hzbi9bw-shard-00-00.rohsk5q.mongodb.net:27017,ac-hzbi9bw-shard-00-01.rohsk5q.mongodb.net:27017,ac-hzbi9bw-shard-00-02.rohsk5q.mongodb.net:27017/gminsta?ssl=true&replicaSet=atlas-1jo7xz-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
// Connect DB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB error:', err.message));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Session
app.use(session({
  secret: 'fallbacksecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/posts', require('./routes/postRoutes'));
app.use('/comments', require('./routes/commentRoutes'));
app.use('/chat', require('./routes/chatRoutes'));

// Pages
const view = f => path.join(__dirname, 'views', f);

app.get('/', (req, res) =>
  res.redirect(req.session.userId ? '/home' : '/login')
);

app.get('/login', (req, res) => res.sendFile(view('login.html')));
app.get('/register', (req, res) => res.sendFile(view('register.html')));
app.get('/home', (req, res) => res.sendFile(view('home.html')));
app.get('/profile', (req, res) => res.sendFile(view('profile.html')));
app.get('/chat', (req, res) => res.sendFile(view('chat.html')));

app.get('/debug/files', (req, res) => {
  const fs = require('fs');
  const path = require('path');

  const postsDir = path.join(__dirname, 'public/uploads/posts');
  const avatarsDir = path.join(__dirname, 'public/uploads/avatars');

  const posts = fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : [];
  const avatars = fs.existsSync(avatarsDir) ? fs.readdirSync(avatarsDir) : [];

  res.json({
    posts,
    avatars
  });
});
// Start
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 GMinsta at http://localhost:${PORT}`);
});
