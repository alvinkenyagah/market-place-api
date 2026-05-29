const User = require('../models/User');
const { uploadToSupabase } = require('../middleware/upload');

// GET /api/users/profile  — get own profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile  — update own profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, bio } = req.body;
    const update = {};
    
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (location) update.location = location;
    if (bio !== undefined) update.bio = bio;
    
    // Process single avatar image buffer if it is included in req
    if (req.file) {
      update.profileImage = await uploadToSupabase(req.file, 'profiles');
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id  — view a provider's public profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};