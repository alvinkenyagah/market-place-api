const { validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

// POST /api/reviews  — customer only, after completed booking
exports.createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking.' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed bookings.' });
    }

    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this booking.' });
    }

    const review = await Review.create({
      bookingId,
      serviceId: booking.serviceId,
      customerId: req.user._id,
      providerId: booking.providerId,
      rating,
      comment,
    });

    await review.populate('customerId', 'name profileImage');

    res.status(201).json({ success: true, message: 'Review submitted.', review });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/service/:serviceId  — public
exports.getServiceReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId })
      .populate('customerId', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/provider/:providerId  — public
exports.getProviderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId })
      .populate('customerId', 'name profileImage')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};
