const express = require('express');
const router  = express.Router();
const Comment = require('../models/Comment');
const requireAuth = require('../middleware/requireAuth');

// POST /comments — add a comment (supports both /comments and /comments/:postId)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { postId, commentText, text } = req.body;
    const body = commentText || text;
    if (!postId) return res.status(400).json({ message: 'postId required' });
    if (!body)   return res.status(400).json({ message: 'Comment text required' });
    const comment = await Comment.create({
      postId,
      author: req.session.userId,   // FIX: use 'author' not 'userId'
      text:   body                  // FIX: use 'text' not 'commentText'
    });
    const populated = await comment.populate('author', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /comments/:postId — alternate route used by profile.html
router.post('/:postId', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });
    const comment = await Comment.create({
      postId: req.params.postId,
      author: req.session.userId,
      text
    });
    const populated = await comment.populate('author', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /comments/:postId — get all comments for a post
router.get('/:postId', requireAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('author', 'username avatar')   // FIX: populate 'author' not 'userId'
      .sort({ createdAt: 1 })
      .lean();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /comments/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, author: req.session.userId });
    if (!comment) return res.status(404).json({ message: 'Not found or unauthorized' });
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
