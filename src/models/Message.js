const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  isSystemInquiry: {
    type: Boolean,
    default: false, // Flag to style the structured initial inquiry differently in UI
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);