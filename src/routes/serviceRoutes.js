const express = require('express');
const { body } = require('express-validator');
const {
  getServices,
  getCategories, // Imported new handler
  getService,
  createService,
  updateService,
  deleteService,
  getMyServices,
} = require('../controllers/serviceController');
const { protect, restrictTo } = require('../middleware/auth');
const {upload} = require('../middleware/upload');

const router = express.Router();

const serviceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number').custom((v) => v >= 0).withMessage('Price cannot be negative'),
  body('location').trim().notEmpty().withMessage('Location is required'),
];

// Public routes
router.get('/', getServices);
router.get('/categories', getCategories); // MUST be declared before /:id route block
router.get('/:id', getService);

// Protected routes
router.use(protect);
router.get('/provider/my', restrictTo('provider'), getMyServices);
router.post('/', restrictTo('provider'), upload.array('images', 5), serviceValidation, createService);
router.put('/:id', restrictTo('provider'), upload.array('images', 5), updateService);
router.delete('/:id', restrictTo('provider', 'admin'), deleteService);

module.exports = router;