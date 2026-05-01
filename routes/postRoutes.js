const express = require('express');
const router = express.Router();
const path = require('path');
const Post = require('../models/Post');
const { post: upload } = require('../upload');
const requireAuth = require('../middleware/requireAuth');

// GET /posts — full feed
router.get('/', requireAuth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .lean();

    const uid = req.session.userId?.toString();

    const result = posts.map(p => ({
      ...p,
      mediaUrl: p.mediaUrl || (p.image ? '/uploads/posts/' + p.image : ''),
      mediaType: p.mediaType || 'image',
      likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
      liked: Array.isArray(p.likes)
        ? p.likes.some(l => l?.toString() === uid)
        : false
    }));

    res.json(result); // IMPORTANT
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.session.userId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .lean();

    const uid = req.session.userId?.toString();

    const result = posts.map(p => ({
      ...p,
      mediaUrl: p.mediaUrl || (p.image ? '/uploads/posts/' + p.image : ''),
      mediaType: p.mediaType || 'image',
      likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
      liked: Array.isArray(p.likes)
        ? p.likes.some(l => l?.toString() === uid)
        : false
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts/:id/likers
router.get('/:id/likers', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('likes', 'username avatar')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post.likes || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /posts
router.post('/', requireAuth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file required' });
    }

    const ext = path.extname(req.file.filename).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);

    const mediaUrl = '/uploads/posts/' + req.file.filename;

    const post = await Post.create({
      author: req.session.userId,
      caption: req.body.caption || '',
      mediaUrl,
      mediaType: isVideo ? 'video' : 'image',
      location: req.body.location || '',
      likes: []
    });

    const populated = await post.populate('author', 'username avatar');
    const obj = populated.toJSON();

    res.json({
      ...obj,
      likesCount: 0,
      liked: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// LIKE
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const uid = req.session.userId.toString();
    const idx = post.likes.map(l => l.toString()).indexOf(uid);

    if (idx === -1) {
      post.likes.push(req.session.userId);
    } else {
      post.likes.splice(idx, 1);
    }

    await post.save();

    res.json({
      likesCount: post.likes.length,
      liked: idx === -1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      author: req.session.userId
    });

    if (!post) {
      return res.status(404).json({
        message: 'Not found or unauthorized'
      });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
