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

// POST /api/chat/message
// REST fallback for sending messages 
router.post('/message', async (req, res) => {
  try {
    const { text, senderName, senderId, replyTo } = req.body;
    
    const newMessage = new Message({
      text,
      senderName,
      senderId,
      replyTo: replyTo || null,
    });
    
    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate('replyTo', 'text senderName').exec();
    
    // Broadcast using Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.emit('receiveMessage', populatedMessage);
    }
    
    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Error sending message via API:', err);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// POST /api/chat/like
// REST fallback for liking messages
router.post('/like', async (req, res) => {
  try {
    const { messageId, userId } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const userIndex = message.likes.indexOf(userId);
    if (userIndex === -1) {
      message.likes.push(userId);
    } else {
      message.likes.splice(userIndex, 1);
    }
    await message.save();

    // Broadcast using Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.emit('messageLiked', { messageId: message._id, likes: message.likes });
    }

    res.json({ messageId: message._id, likes: message.likes });
  } catch (err) {
    console.error('Error liking message via API:', err);
    res.status(500).json({ message: 'Server error liking message' });
  }
});

