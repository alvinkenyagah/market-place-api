const express = require('express');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getDashboard,
  getUsers,
  suspendUser,
  deleteUser,
  getServices,
  removeService,
  getBookings,
  suspendService, // <--- Imported your new feature handler
} = require('../controllers/adminController');

const router = express.Router();

// Middleware checking payload validation results specifically for route validation chains
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ==========================================
// PROTECTED ADMIN GLOBAL ROUTE LOCKS
// ==========================================
router.use(protect);
router.use(restrictTo('admin'));

// --- Dashboard Routes ---
router.get('/dashboard', getDashboard);

// --- User Management Routes ---
router.get('/users', getUsers);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

// --- Service Management Routes ---
router.get('/services', getServices);
router.delete('/services/:id', removeService);

// 🆕 NEW: Suspend service with mandatory explanation note when suspending
router.patch(
  '/services/:id/suspend',
  [
    body('note')
      .optional()
      .trim()
      .isLength({ min: 5 })
      .withMessage('Suspension note must be at least 5 characters long if provided.'),
  ],
  validateRequest,
  suspendService
);

// --- Booking Management Routes ---
router.get('/bookings', getBookings);

module.exports = router;