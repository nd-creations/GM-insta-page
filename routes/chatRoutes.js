const express = require('express');
const router  = express.Router();
const Message = require('../models/Message');
const requireAuth = require('../middleware/requireAuth');

// GET /chat/conversations — all conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const me = req.session.userId;
    const messages = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }]
    })
    .populate('senderId',   'username avatar')
    .populate('receiverId', 'username avatar')
    .sort({ createdAt: -1 }).lean();

    // Group by conversation partner
    const convMap = new Map();
    messages.forEach(m => {
      const other = m.senderId?._id?.toString() === me.toString() ? m.receiverId : m.senderId;
      const key = other?._id?.toString();
      if (key && !convMap.has(key)) {
        convMap.set(key, {
          _id: key,
          participants: [m.senderId, m.receiverId],
          lastMessage: { text: m.messageText },
          updatedAt: m.createdAt
        });
      }
    });
    res.json([...convMap.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /chat/:otherId/messages — messages between two users
router.get('/:otherId/messages', requireAuth, async (req, res) => {
  try {
    const me = req.session.userId;
    const other = req.params.otherId;
    const messages = await Message.find({
      $or: [
        { senderId: me,    receiverId: other },
        { senderId: other, receiverId: me    }
      ]
    })
    .populate('senderId',   'username avatar')
    .populate('receiverId', 'username avatar')
    .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /chat — send a message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { receiverId, messageText } = req.body;
    if (!messageText) return res.status(400).json({ message: 'Message required' });
    const message = await Message.create({
      senderId: req.session.userId,
      receiverId,
      messageText
    });
    const populated = await message.populate(['senderId', 'receiverId'], 'username avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /chat/:otherId/messages — send message (alternate route used by chat.html)
router.post('/:otherId/messages', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message required' });
    const message = await Message.create({
      senderId: req.session.userId,
      receiverId: req.params.otherId,
      messageText: text
    });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;