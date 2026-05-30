const express = require('express');
const { body } = require('express-validator');
const {
  getServices,
  getCategories,
  getService,
  createService,
  updateService,
  deleteService,
  getMyServices,
} = require('../controllers/serviceController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../middleware/upload');





const router = express.Router();

// --- UPDATED VALIDATION RULES ---
const serviceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((v) => v >= 0)
    .withMessage('Price cannot be negative'),
    
  // Refactored from body('location') to match the new nested GeoJSON structure requirements
  body('formattedAddress')
    .trim()
    .notEmpty()
    .withMessage('Human-readable address is required'),
    
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
    
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
];
// ---------------------------------

// Public routes
router.get('/', getServices);
router.get('/categories', getCategories); 
router.get('/:id', getService);

// Protected routes
router.use(protect);
router.get('/provider/my', restrictTo('provider'), getMyServices);
router.post('/', restrictTo('provider'), upload.array('images', 5), serviceValidation, createService);
router.put('/:id', restrictTo('provider'), upload.array('images', 5), updateService); // If you strictly want payload validations on updates, add serviceValidation array here too
router.delete('/:id', restrictTo('provider', 'admin'), deleteService);

module.exports = router;