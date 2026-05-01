const express = require('express');
const router = express.Router();
const User = require('../models/User');
const uploadMiddleware = require('../upload'); // upload.js is at ROOT
const requireAuth = require('../middleware/requireAuth');

router.post('/register', uploadMiddleware.avatar.single('avatar'), async (req, res) => {
  try {
    const { fullname, username, email, password, bio } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'Username or email already taken' });
    const avatarUrl = req.file ? '/uploads/avatars/' + req.file.filename : '/uploads/default-avatar.png';
    const user = await User.create({ fullname, username, email, password, bio, avatar: avatarUrl });
    req.session.userId   = user._id;
    req.session.username = user.username;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findOne(email ? { email } : { username });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    req.session.userId   = user._id;
    req.session.username = user.username;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select('-password')
      .populate('followers', '_id username avatar')
      .populate('following', '_id username avatar')
      .lean();
    if (!user) return res.status(401).json({ message: 'Not logged in' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// FIX: use uploadMiddleware.avatar for avatar upload
router.post('/avatar', requireAuth, uploadMiddleware.avatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const avatarUrl = '/uploads/avatars/' + req.file.filename;
    await User.findByIdAndUpdate(req.session.userId, { avatar: avatarUrl });
    res.json({ avatar: avatarUrl, success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullname, username, bio, website } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.session.userId,
      { fullname, username, bio, website },
      { new: true, select: '-password' }
    ).lean();
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/users', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { _id: { $ne: req.session.userId } };
    if (q) filter.$or = [
      { username: { $regex: q, $options: 'i' } },
      { fullname:  { $regex: q, $options: 'i' } }
    ];
    const users = await User.find(filter).select('username fullname avatar followers').lean();
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/follow/:id', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.session.userId;
    if (targetId === myId.toString()) return res.status(400).json({ message: 'Cannot follow yourself' });
    const me = await User.findById(myId);
    const isFollowing = me.following.some(id => id.toString() === targetId);
    if (isFollowing) {
      await User.findByIdAndUpdate(myId,     { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
      res.json({ followed: false });
    } else {
      await User.findByIdAndUpdate(myId,     { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
      res.json({ followed: true });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
