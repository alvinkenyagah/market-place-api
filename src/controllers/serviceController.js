const { validationResult } = require('express-validator');
const Service = require('../models/Service');
const { uploadToSupabase } = require('../middleware/upload');

// GET /api/services — public, browse + search
exports.getServices = async (req, res, next) => {
  try {
    const { search, category, location, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    
    if (category) {
      if (category.includes(',')) {
        const categoryArray = category.split(',');
        query.category = { $in: categoryArray };
      } else {
        query.category = { $regex: new RegExp(category, 'i') };
      }
    }
    
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

// GET /api/services/categories — public, aggregates unique categories in use
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Service.distinct('category', { isActive: true });
    categories.sort((a, b) => a.localeCompare(b));
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// GET /api/services/:id — public
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

// POST /api/services — provider only
exports.createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, category, price, location } = req.body;
    
    // Safety check on file count from memory storage
    const reqFiles = req.files || [];
    if (reqFiles.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'You can upload a maximum of 4 images for a service.',
      });
    }

    // Map each file buffer to a Supabase upload pipeline
    const uploadPromises = reqFiles.map((file) => uploadToSupabase(file, 'services'));
    const images = await Promise.all(uploadPromises);

    const service = await Service.create({
      providerId: req.user._id,
      title,
      description,
      category,
      price: Number(price),
      location,
      images, // Stores global URLs array directly inside MongoDB
    });

    res.status(201).json({ success: true, message: 'Service created successfully.', service });
  } catch (error) {
    next(error);
  }
};

// PUT /api/services/:id — provider (owner) only
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    if (service.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this service.' });
    }

    const { title, description, category, price, location, isActive } = req.body;
    
    let retainedImages = [];
    if (req.body.existingImages) {
      retainedImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
    }

    const reqFiles = req.files || [];
    const totalImagesCount = retainedImages.length + reqFiles.length;

    if (totalImagesCount > 4) {
      return res.status(400).json({
        success: false,
        message: `Maximum 4 images allowed. Total requested: ${totalImagesCount} (Retained: ${retainedImages.length}, New uploads: ${reqFiles.length})`,
      });
    }

    // Process and append new images to existing assets
    const uploadPromises = reqFiles.map((file) => uploadToSupabase(file, 'services'));
    const newImages = await Promise.all(uploadPromises);
    const finalImagesArray = [...retainedImages, ...newImages];

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(location && { location }),
        ...(isActive !== undefined && { isActive }),
        images: finalImagesArray
      },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Service updated.', service: updatedService });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/services/:id — provider (owner) or admin
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

// GET /api/services/provider/my — provider's own listings
exports.getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ providerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};