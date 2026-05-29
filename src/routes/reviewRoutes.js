const express = require('express');
const { body } = require('express-validator');
const { createReview, getServiceReviews, getProviderReviews } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public
router.get('/service/:serviceId', getServiceReviews);
router.get('/provider/:providerId', getProviderReviews);

// Protected
router.post(
  '/',
  protect,
  restrictTo('customer'),
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ],
  createReview
);

module.exports = router;
