const express = require('express');
const {
  getDashboard,
  getUsers,
  suspendUser,
  deleteUser,
  getServices,
  removeService,
  getBookings,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);
router.get('/services', getServices);
router.delete('/services/:id', removeService);
router.get('/bookings', getBookings);

module.exports = router;
