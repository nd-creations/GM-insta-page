const express = require('express');
const router  = express.Router();
const Comment = require('../models/Comment');
const requireAuth = require('../middleware/requireAuth');

// POST /comments — add a comment
router.post('/', requireAuth, async (req, res) => {
  try {
    const { postId, commentText, text } = req.body;
    const body = commentText || text;
    if (!body) return res.status(400).json({ message: 'Comment text required' });
    const comment = await Comment.create({
      postId,
      userId: req.session.userId,
      commentText: body
    });
    const populated = await comment.populate('userId', 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /comments/:postId — get all comments for a post
router.get('/:postId', requireAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('userId', 'username avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /comments/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!comment) return res.status(404).json({ message: 'Not found or unauthorized' });
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;