console.log("👉 MONGO_URI:", process.env.MONGO_URI);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected to:', process.env.MONGO_URI))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // ✅ CORRECT - use same Atlas URI from .env
store: MongoStore.create({
  mongoUrl: process.env.MONGO_URI
}), // ✅ comma added here
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));
// Serve uploaded media
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/posts', require('./routes/postRoutes'));
app.use('/comments', require('./routes/commentRoutes'));
app.use('/chat', require('./routes/chatRoutes'));

// Serve HTML pages
app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/home');
  res.redirect('/login');
});
app.get('/login',    (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/home',     (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});
app.get('/profile',  (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});
app.get('/chat',     (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GMinsta running at http://localhost:${PORT}`);
});
