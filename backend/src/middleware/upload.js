const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/avatars',
    'uploads/documents',
    'uploads/products',
    'uploads/stores',
    'uploads/temp',
    'uploads/videos',
    'uploads/sounds'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';
    
    // Determine upload path based on field name
    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars';
    } else if (file.fieldname === 'documents' || file.fieldname === 'document') {
      uploadPath = 'uploads/documents';
    } else if (file.fieldname === 'images' || file.fieldname === 'image') {
      uploadPath = 'uploads/products';
    } else if (file.fieldname === 'logo' || file.fieldname === 'banner') {
      uploadPath = 'uploads/stores';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    avatar: /jpeg|jpg|png|gif|webp/,
    documents: /jpeg|jpg|png|pdf/,
    document: /jpeg|jpg|png|pdf/,
    images: /jpeg|jpg|png|gif|webp/,
    image: /jpeg|jpg|png|gif|webp/,
    logo: /jpeg|jpg|png|gif|webp/,
    banner: /jpeg|jpg|png|gif|webp/
  };
  
  const fieldName = file.fieldname;
  const fileType = allowedTypes[fieldName] || /jpeg|jpg|png/;
  
  // Check file extension
  const extName = fileType.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimeType = fileType.test(file.mimetype);
  
  if (mimeType && extName) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fieldName}. Allowed types: ${fileType.source}`));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Middleware for different upload types
const uploadMiddleware = {
  // Single avatar upload
  avatar: upload.single('avatar'),
  
  // Multiple document uploads (up to 3 files)
  documents: upload.array('documents', 3),
  
  // Single document upload
  document: upload.single('document'),
  
  // Product images upload (up to 10 files)
  productImages: upload.array('images', 10),
  
  // Single product image
  productImage: upload.single('image'),
  
  // Store creation with multiple fields
  storeCreation: upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]),
  
  // Store update with images only
  storeUpdate: upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  
  // Mixed uploads (avatar + documents)
  mixed: upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 3 }
  ]),
  
  // Product with images
  productWithImages: upload.fields([
    { name: 'images', maxCount: 10 }
  ]),
  
  // Any single file
  any: upload.any()
};

// Error handler for multer errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 5 files.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Utility function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to move file
const moveFile = (oldPath, newPath) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(newPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.renameSync(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
};

// Chunk upload middleware (for video/audio chunks)
const chunkStorage = multer.memoryStorage(); // Store chunks in memory for processing
const uploadChunk = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max chunk size
  }
});

module.exports = {
  uploadMiddleware,
  uploadChunk,
  handleUploadError,
  deleteFile,
  moveFile,
  ensureUploadDirs
};