const express = require('express');
const { getProfile, updateProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const {upload} = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', upload.single('profileImage'), updateProfile);
router.get('/:id', getUserProfile);

module.exports = router;
