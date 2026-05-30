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
    // --- LOCATION REFACTOR ---
    location: {
      formattedAddress: {
        type: String,
        required: [true, 'Please add a human-readable location'],
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          required: true,
          default: 'Point',
        },
        // [longitude, latitude]
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },
    // -------------------------
    images: {
      type: [String],
      default: [],
      validate: [arrayLimit, 'A service can have a maximum of 4 images.'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // --- ADDED FOR ADMIN SUSPENSION ---
    isAdminSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionNote: {
      type: String,
      default: '',
    },


  },
  {
    timestamps: true,
  }
);

function arrayLimit(val) {
  return val.length <= 4;
}

// Updated index layouts
serviceSchema.index({ title: 'text', description: 'text', category: 'text', 'location.formattedAddress': 'text' });
serviceSchema.index({ 'location.coordinates': '2dsphere' }); // Allows fast proximity queries
serviceSchema.index({ providerId: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);