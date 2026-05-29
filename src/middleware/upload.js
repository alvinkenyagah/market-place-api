const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'uploads';
const supabase = createClient(supabaseUrl, supabaseKey);

// Use memory storage so file buffers are available in req.file / req.files
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

// Helper function to upload a single buffer to Supabase
const uploadToSupabase = async (file, folder = 'general') => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${folder}/${uniqueSuffix}${path.extname(file.originalname)}`;

  const { data, error } = await supabase.storage
    .from(supabaseBucket)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  // Retrieve public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from(supabaseBucket)
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
};

// Export both multer and the helper function
module.exports = {
  upload,
  uploadToSupabase,
};