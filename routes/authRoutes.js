const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/upload');
const requireAuth = require('../middleware/requireAuth');

// POST /auth/register
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { fullname, username, email, password, bio } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'Username or email already taken' });
    const avatarUrl = req.file ? '/uploads/avatars/' + req.file.filename : '/uploads/default-avatar.png';
    const user = await User.create({ fullname, username, email, password, bio, avatar: avatarUrl });
    req.session.userId   = user._id;
    req.session.username = user.username;
    res.json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findOne(email ? { email } : { username });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    req.session.userId   = user._id;
    req.session.username = user.username;
    res.json({ success: true, message: 'Logged in' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// POST /auth/logout (for fetch calls)
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select('-password')
      .populate('followers', '_id username avatar')
      .populate('following', '_id username avatar')
      .lean();
    if (!user) return res.status(401).json({ message: 'Not logged in' });
    user.followersCount = user.followers.length;
    user.followingCount = user.following.length;
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/avatar — upload/update profile photo
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const avatarUrl = '/uploads/avatars/' + req.file.filename;
    await User.findByIdAndUpdate(req.session.userId, { avatar: avatarUrl });
    res.json({ success: true, avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /auth/profile — update profile fields
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullname, username, bio, website } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.session.userId,
      { fullname, username, bio, website },
      { new: true, select: '-password' }
    ).lean();
    updated.followersCount = updated.followers?.length || 0;
    updated.followingCount = updated.following?.length || 0;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /auth/suggestions — users to follow
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.session.userId).lean();
    const followingIds = (me.following || []).map(id => id.toString());
    followingIds.push(req.session.userId.toString());
    const users = await User.find({ _id: { $nin: followingIds } })
      .select('username fullname avatar followers following')
      .limit(20).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /auth/users — all users except me
router.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.session.userId } })
      .select('username fullname avatar').lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /auth/search?q=... — search friends by username, fullname, or user ID
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);

    // Try matching by ObjectId first (if it looks like one)
    const isObjectId = /^[a-f\d]{24}$/i.test(q);
    let users = [];
    if (isObjectId) {
      const byId = await User.findById(q).select('username fullname avatar followers following').lean();
      if (byId && byId._id.toString() !== req.session.userId.toString()) users = [byId];
    }
    if (!users.length) {
      users = await User.find({
        _id: { $ne: req.session.userId },
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { fullname: { $regex: q, $options: 'i' } }
        ]
      }).select('username fullname avatar followers following').limit(15).lean();
    }

    // Add isFollowing flag for each result
    const me = await User.findById(req.session.userId).select('following').lean();
    const myFollowing = (me.following || []).map(id => id.toString());
    const result = users.map(u => ({
      ...u,
      isFollowing: myFollowing.includes(u._id.toString()),
      followersCount: u.followers?.length || 0
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /auth/follow/:id — follow/unfollow toggle
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
      res.json({ followed: false, message: 'Unfollowed' });
    } else {
      await User.findByIdAndUpdate(myId,     { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
      res.json({ followed: true, message: 'Following' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
