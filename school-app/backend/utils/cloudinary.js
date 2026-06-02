const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a base64 encoded image to Cloudinary.
 * @param {string} base64Data - Base64 encoded image data (e.g. data:image/png;base64,...)
 * @param {string} folder - The folder name in Cloudinary (e.g. 'profiles', 'schools')
 * @returns {Promise<string>} The secure https URL of the uploaded image
 */
const uploadToCloudinary = async (base64Data, folder = 'school_connect') => {
  try {
    if (!base64Data) {
      throw new Error('No image data provided');
    }
    
    // Cloudinary uploader natively supports base64 Data URIs
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `school_connect/${folder}`,
      resource_type: 'image'
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Deletes an image from Cloudinary using its secure URL.
 * @param {string} imageUrl - The secure URL of the image to delete
 */
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Check if the URL is a Cloudinary URL
    if (!imageUrl.includes('res.cloudinary.com')) {
      return;
    }

    // Extract public ID from URL
    // Standard format: http://res.cloudinary.com/cloud_name/image/upload/v12345678/folder/public_id.jpg
    const parts = imageUrl.split('/image/upload/');
    if (parts.length < 2) return;

    const pathAndVersion = parts[1];
    
    // Remove version prefix if present (e.g. v12345678/)
    const withoutVersion = pathAndVersion.replace(/^v\d+\//, '');
    
    // Remove file extension (e.g. .jpg, .png, etc.)
    const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf('.')) || withoutVersion;

    console.log(`[CLOUDINARY] Deleting old image: ${publicId}`);
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('[CLOUDINARY] Error deleting image:', error.message);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
