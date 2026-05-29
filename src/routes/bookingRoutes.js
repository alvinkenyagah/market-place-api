const express = require('express');
const { body } = require('express-validator');
const {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  getBooking,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  restrictTo('customer'),
  [
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
  ],
  createBooking
);

router.get('/customer', restrictTo('customer'), getCustomerBookings);
router.get('/provider', restrictTo('provider'), getProviderBookings);
router.get('/:id', getBooking);
router.patch(
  '/:id/status',
  [body('status').isIn(['accepted', 'completed', 'cancelled']).withMessage('Invalid status')],
  updateBookingStatus
);

module.exports = router;
