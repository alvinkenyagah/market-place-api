const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter reference is required']
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Target provider reference is required']
  },
  reason: {
    type: String,
    required: [true, 'Please select a reason for the report'],
    enum: {
      values: ['Harassment', 'Fraud or Scam', 'Poor Quality / Unprofessionalism', 'Late / No Show', 'Other'],
      message: '{VALUE} is not a valid reporting category'
    }
  },
  description: {
    type: String,
    required: [true, 'Detailed description context is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate reports by the same customer against the same provider
reportSchema.index({ reporterId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);