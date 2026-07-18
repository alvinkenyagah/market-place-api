const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// GET /api/admin/dashboard  — stats overview
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalServices, totalBookings, totalReviews] = await Promise.all([
      User.countDocuments(),
      Service.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: { totalUsers, totalServices, totalBookings, totalReviews },
      usersByRole,
      bookingsByStatus,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users  — list all users with filters
exports.getUsers = async (req, res, next) => {
  try {
    const { role, isSuspended, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isSuspended !== undefined) query.isSuspended = isSuspended === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.status(200).json({ success: true, total, page: Number(page), users });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/suspend  — toggle suspend
exports.suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an admin.' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete an admin.' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/services  — all services including inactive
exports.getServices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Service.countDocuments();
    const services = await Service.find()
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({ success: true, total, services });
  } catch (error) {
    next(error);
  }
};


// PATCH /api/admin/services/:id/suspend — toggle service suspension with a note
// exports.suspendService = async (req, res, next) => {
//   try {
//     const { note } = req.body;
//     const service = await Service.findById(req.params.id);
    
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found.' });
//     }

//     // Toggle suspension state
//     service.isAdminSuspended = !service.isAdminSuspended;
    
//     // Manage suspension note allocation
//     if (service.isAdminSuspended) {
//       service.suspensionNote = note || 'Suspended by an Administrator.';
//     } else {
//       service.suspensionNote = ''; // Clear note upon unsuspension
//     }

//     await service.save();

//     res.status(200).json({
//       success: true,
//       message: `Service status updated to: ${service.isAdminSuspended ? 'Suspended' : 'Active'}.`,
//       service,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// adminController.js

exports.suspendService = async (req, res, next) => {
  try {
    const { note } = req.body;
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Toggle suspension state
    service.isAdminSuspended = !service.isAdminSuspended;
    
    // Manage suspension note allocation safely
    if (service.isAdminSuspended) {
      service.suspensionNote = note && note.trim() ? note.trim() : 'Suspended by an Administrator.';
    } else {
      service.suspensionNote = ''; // Clear note upon unsuspension
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: `Service status updated to: ${service.isAdminSuspended ? 'Suspended' : 'Active'}.`,
      service,
    });
  } catch (error) {
    next(error);
  }
};


// DELETE /api/admin/services/:id
exports.removeService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    await service.deleteOne();
    res.status(200).json({ success: true, message: 'Service removed.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/bookings  — all bookings
exports.getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('serviceId', 'title')
      .populate('customerId', 'name email')
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({ success: true, total, bookings });
  } catch (error) {
    next(error);
  }
};
