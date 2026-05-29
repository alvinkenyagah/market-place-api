const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a service title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
    },
    images: {
      type: [String],
      default: [],
      // The custom validator restricting the array length to a maximum of 4
      validate: [arrayLimit, 'A service can have a maximum of 4 images.'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Custom validation function for the images array
function arrayLimit(val) {
  return val.length <= 4;
}

// Index for search
serviceSchema.index({ title: 'text', description: 'text', category: 'text', location: 'text' });
serviceSchema.index({ providerId: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);