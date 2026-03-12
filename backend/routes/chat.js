const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /api/chat/history
// Fetch the last 100 messages for the community chat
router.get('/history', async (req, res) => {
  try {
    // Populate the replyTo field so frontend can show what message is being replied to
    const messages = await Message.find()
      .sort({ createdAt: -1 }) // get newest first
      .limit(100)
      .populate('replyTo', 'text senderName') 
      .exec();

    // Reverse to send oldest first so they appear in chronological order in the UI
    res.json(messages.reverse());
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
});

module.exports = router;
