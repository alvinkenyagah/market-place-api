const { validationResult } = require('express-validator');
const Service = require('../models/Service');

// GET /api/services  — public, browse + search
exports.getServices = async (req, res, next) => {
  try {
    const { search, category, location, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = { $regex: new RegExp(category, 'i') };
    if (location) query.location = { $regex: new RegExp(location, 'i') };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate('providerId', 'name profileImage location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      services,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/services/:id  — public
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'providerId',
      'name profileImage location phone createdAt'
    );
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    res.status(200).json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

// POST /api/services  — provider only
exports.createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, category, price, location } = req.body;
    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    // Check image limit on creation
    if (images.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'You can upload a maximum of 4 images for a service.',
      });
    }

    const service = await Service.create({
      providerId: req.user._id,
      title,
      description,
      category,
      price: Number(price),
      location,
      images,
    });

    res.status(201).json({ success: true, message: 'Service created successfully.', service });
  } catch (error) {
    next(error);
  }
};

// PUT /api/services/:id  — provider (owner) only
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    if (service.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this service.' });
    }

    const { title, description, category, price, location, isActive } = req.body;
    
    // Parse existing retained images from FormData payload safely
    let retainedImages = [];
    if (req.body.existingImages) {
      retainedImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
    }

    // Map any incoming new upload image objects to their destination paths
    const newImages = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    // Combine retained images with new file uploads
    const finalImagesArray = [...retainedImages, ...newImages];

    // Enforce maximum images limit rule validation check
    if (finalImagesArray.length > 4) {
      return res.status(400).json({
        success: false,
        message: `Maximum 4 images allowed. Total requested: ${finalImagesArray.length} (Retained: ${retainedImages.length}, New uploads: ${newImages.length})`,
      });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(location && { location }),
        ...(isActive !== undefined && { isActive }),
        images: finalImagesArray // Completely overwrite array state with the remaining + fresh uploads setup
      },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Service updated.', service: updatedService });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/services/:id  — provider (owner) or admin
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    const isOwner = service.providerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this service.' });
    }

    await service.deleteOne();
    res.status(200).json({ success: true, message: 'Service deleted.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/services/provider/my  — provider's own listings
exports.getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ providerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};