const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store incoming files in memory as buffers
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Helper function to upload a memory buffer to Cloudinary
 * @param {Object} file - The req.file object from Multer
 * @param {String} folder - Cloudinary folder name (e.g., 'profiles', 'services')
 */
const uploadToCloudinary = (file, folder = 'general') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `marketplace/${folder}`, // Organizes assets into folders in your Media Library
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Returns the persistent global 'https://...' URL
      }
    );

    // Write the file buffer to the Cloudinary stream
    uploadStream.end(file.buffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary,
};