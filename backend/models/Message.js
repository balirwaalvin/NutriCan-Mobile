const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderId: {
    type: String,  // could be a guest ID or user email/ID depending on App implementation
    required: true,
  },
  likes: {
    type: [String], // Array of user IDs or emails who liked the message
    default: [],
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Avoid recompiling model if it already exists
module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
