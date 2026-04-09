const express = require('express');
const router  = express.Router();
const Message = require('../models/Message');
const User    = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

// GET /chat/conversations — all unique conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const me = req.session.userId.toString();
    const messages = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }]
    })
    .populate('senderId',   'username avatar')
    .populate('receiverId', 'username avatar')
    .sort({ createdAt: -1 })
    .lean();

    // Group by conversation partner — keyed by their _id
    const convMap = new Map();
    messages.forEach(m => {
      const sender   = m.senderId;
      const receiver = m.receiverId;
      const other    = sender?._id?.toString() === me ? receiver : sender;
      const key      = other?._id?.toString();
      if (!key || convMap.has(key)) return;
      convMap.set(key, {
        _id:         key,           // use partner's _id as conversation id
        participants: [sender, receiver],
        lastMessage: { text: m.messageText },
        updatedAt:   m.createdAt
      });
    });
    res.json([...convMap.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /chat/users — all users (for starting a new conversation)
router.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.session.userId } })
      .select('username fullname avatar')
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /chat/search?q=username — search users by username or ID
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);
    const users = await User.find({
      _id: { $ne: req.session.userId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullname: { $regex: q, $options: 'i' } }
      ]
    }).select('username fullname avatar').limit(10).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /chat/:otherId/messages — messages between current user and another user
router.get('/:otherId/messages', requireAuth, async (req, res) => {
  try {
    const me    = req.session.userId;
    const other = req.params.otherId;
    const messages = await Message.find({
      $or: [
        { senderId: me,    receiverId: other },
        { senderId: other, receiverId: me    }
      ]
    })
    .populate('senderId',   'username avatar')
    .populate('receiverId', 'username avatar')
    .sort({ createdAt: 1 })
    .lean();

    // Normalize field names for frontend
    const result = messages.map(m => ({
      ...m,
      text:   m.messageText,
      sender: m.senderId,
      receiver: m.receiverId
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /chat/:otherId/messages — send a message to another user
router.post('/:otherId/messages', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message required' });
    const message = await Message.create({
      senderId:    req.session.userId,
      receiverId:  req.params.otherId,
      messageText: text
    });
    const populated = await message.populate([
      { path: 'senderId',   select: 'username avatar' },
      { path: 'receiverId', select: 'username avatar' }
    ]);
    const obj = populated.toJSON();
    res.json({ ...obj, text: obj.messageText, sender: obj.senderId, receiver: obj.receiverId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /chat — send message (general route)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { receiverId, text, messageText } = req.body;
    const body = text || messageText;
    if (!body?.trim()) return res.status(400).json({ message: 'Message required' });
    const message = await Message.create({
      senderId:    req.session.userId,
      receiverId,
      messageText: body
    });
    const populated = await message.populate([
      { path: 'senderId',   select: 'username avatar' },
      { path: 'receiverId', select: 'username avatar' }
    ]);
    const obj = populated.toJSON();
    res.json({ ...obj, text: obj.messageText, sender: obj.senderId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
