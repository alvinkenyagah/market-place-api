const User = require('../models/User');

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
    // 1. Destructure bio from the request body alongside name, phone, and location
    const { name, phone, location, bio } = req.body;
    const update = {};
    
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (location) update.location = location;
    
    // 2. Add bio to the update payload if it is provided in the request
    // We use typeof check or explicit check to allow users to clear their bio (empty string)
    if (bio !== undefined) update.bio = bio;
    
    if (req.file) update.profileImage = `/uploads/${req.file.filename}`;

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