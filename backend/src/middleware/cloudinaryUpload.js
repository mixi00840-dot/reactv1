const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mixillo/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

// Storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mixillo/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

// Storage for product images
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mixillo/products',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' }
    ]
  }
});

// Storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mixillo/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }
    ]
  }
});

// Storage for audio/sounds
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mixillo/sounds',
    resource_type: 'video', // Cloudinary uses 'video' for audio
    allowed_formats: ['mp3', 'wav', 'ogg', 'm4a']
  }
});

// File size limits
const limits = {
  fileSize: 500 * 1024 * 1024, // 500MB
  files: 10 // Max 10 files per request
};

// Create multer instances
const uploadVideo = multer({ storage: videoStorage, limits });
const uploadImage = multer({ storage: imageStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadProductImage = multer({ storage: productImageStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadAudio = multer({ storage: audioStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// Middleware exports
module.exports = {
  uploadVideo: uploadVideo.single('video'),
  uploadVideos: uploadVideo.array('videos', 10),
  uploadImage: uploadImage.single('image'),
  uploadImages: uploadImage.array('images', 10),
  uploadProductImage: uploadProductImage.single('image'),
  uploadProductImages: uploadProductImage.array('images', 5),
  uploadAvatar: uploadAvatar.single('avatar'),
  uploadAudio: uploadAudio.single('audio'),
  uploadAudios: uploadAudio.array('audios', 20)
};

