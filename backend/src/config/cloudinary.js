const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlg6dnlj4',
  api_key: process.env.CLOUDINARY_API_KEY || '287216393992378',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'kflDVBjiq-Jkc-IgDWlggtdc6Yw'
});

/**
 * Upload file to Cloudinary
 * @param {Buffer|Stream} file - File buffer or stream
 * @param {Object} options - Upload options
 * @returns {Promise} - Cloudinary response
 */
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'mixillo',
      resource_type: 'auto', // auto-detect file type
      transformation: options.transformation || [],
      ...options
    };

    const result = await cloudinary.uploader.upload(file, defaultOptions);
    
    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration, // For videos
        bytes: result.bytes,
        thumbnail: result.thumbnail_url || generateThumbnailUrl(result.secure_url, result.resource_type)
      }
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate thumbnail URL for videos
 */
const generateThumbnailUrl = (videoUrl, resourceType) => {
  if (resourceType !== 'video') return videoUrl;
  
  // Cloudinary video thumbnail transformation
  const publicId = videoUrl.split('/').pop().split('.')[0];
  return `https://res.cloudinary.com/dlg6dnlj4/video/upload/so_0,w_300,h_169,c_fill/${publicId}.jpg`;
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: result.result === 'ok',
      data: result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload video with thumbnail generation
 */
const uploadVideoWithThumbnail = async (file, options = {}) => {
  try {
    const uploadOptions = {
      folder: 'mixillo/videos',
      resource_type: 'video',
      eager: [
        { width: 300, height: 169, crop: 'fill', format: 'jpg' } // Thumbnail
      ],
      eager_async: true,
      ...options
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        thumbnail: result.eager?.[0]?.secure_url || generateThumbnailUrl(result.secure_url, 'video')
      }
    };
  } catch (error) {
    console.error('Video upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload image with optimization
 */
const uploadImage = async (file, options = {}) => {
  try {
    const uploadOptions = {
      folder: 'mixillo/images',
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadVideoWithThumbnail,
  uploadImage,
  deleteFromCloudinary,
  generateThumbnailUrl
};

