const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// POST /api/bookings  — customer only
exports.createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { serviceId, bookingDate, notes } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive.' });
    }

    // Prevent customer from booking their own service (if provider is also a customer)
    if (service.providerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot book your own service.' });
    }

    const booking = await Booking.create({
      serviceId,
      customerId: req.user._id,
      providerId: service.providerId,
      bookingDate: new Date(bookingDate),
      notes,
    });

    await booking.populate([
      { path: 'serviceId', select: 'title price location' },
      { path: 'providerId', select: 'name email phone' },
    ]);

    res.status(201).json({ success: true, message: 'Booking created.', booking });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/customer  — customer's own bookings
exports.getCustomerBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { customerId: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('serviceId', 'title price location images')
      .populate('providerId', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/provider  — provider's incoming bookings
exports.getProviderBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { providerId: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('serviceId', 'title price')
      .populate('customerId', 'name email phone profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id  — booking detail (owner or provider)
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'title price location description')
      .populate('customerId', 'name email phone')
      .populate('providerId', 'name email phone');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isCustomer = booking.customerId._id.toString() === req.user._id.toString();
    const isProvider = booking.providerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/status  — provider accepts/rejects/completes, customer cancels
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isProvider = booking.providerId.toString() === req.user._id.toString();
    const isCustomer = booking.customerId.toString() === req.user._id.toString();

    // Define allowed transitions per role
    const providerAllowed = ['accepted', 'cancelled'];
    const customerAllowed = ['cancelled', 'completed'];

    if (isProvider && !providerAllowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Provider cannot set status to '${status}'.` });
    }
    if (isCustomer && !customerAllowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Customer can only cancel bookings.` });
    }
    if (!isProvider && !isCustomer) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Prevent updating already completed or cancelled bookings
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot update a '${booking.status}' booking.` });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ success: true, message: `Booking ${status}.`, booking });
  } catch (error) {
    next(error);
  }
};
