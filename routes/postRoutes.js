const express = require('express');
const router  = express.Router();
const path    = require('path');
const Post = require('../models/Post');
const upload  = require('../upload');
const requireAuth = require('../requireAuth');

// Helper — add likesCount to each post
function addLikesCount(posts) {
  return posts.map(p => ({
    ...p,
    likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
    liked: false // will be set per-user if needed
  }));
}

// GET /posts — all posts feed
// ── ADD THIS ROUTE to your postRoutes.js ──
// Place it right after the /:id/like route
// GET /posts/:id/likers — returns list of users who liked a post

router.get('/:id/likers', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('likes', 'username avatar')
      .lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post.likes || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts/mine — current user's posts
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.session.userId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .lean();
    const userId = req.session.userId?.toString();
    const result = posts.map(p => ({
      ...p,
      likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
      liked: Array.isArray(p.likes) ? p.likes.some(l => l?.toString() === userId) : false
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /posts — create post with image OR video
router.post('/', requireAuth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Media required' });
    const ext = path.extname(req.file.filename).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
    const post = await Post.create({
      author:    req.session.userId,
      caption:   req.body.caption || '',
      mediaUrl:  '/uploads/posts/' + req.file.filename,
      mediaType: isVideo ? 'video' : 'image',
      location:  req.body.location || '',
      likes:     [],
    });
    const populated = await post.populate('author', 'username avatar');
    res.json({ ...populated.toJSON(), likesCount: 0, liked: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /posts/:id/like — toggle like, returns updated count
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const uid = req.session.userId.toString();
    const idx = post.likes.map(l => l?.toString()).indexOf(uid);
    if (idx === -1) {
      post.likes.push(req.session.userId);
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();
    res.json({
      likesCount: post.likes.length,
      liked: idx === -1 // true if we just added the like
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /posts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, author: req.session.userId });
    if (!post) return res.status(404).json({ message: 'Post not found or unauthorized' });
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;