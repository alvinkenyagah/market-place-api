const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
}, { timestamps: true });

// Ensure there is only one active chat thread per customer-provider-service combination
chatSchema.index({ serviceId: 1, customerId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);