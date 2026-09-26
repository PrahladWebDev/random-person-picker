const { v2: cloudinary } = require('cloudinary');

// If these are missing, uploads don't throw a loud error — Cloudinary's SDK
// just fails the request with an auth error that was previously swallowed
// into a generic "Failed to save entry." (see routes/people.js). Warn at
// boot so a misconfigured .env is obvious immediately instead of only
// showing up as "photos never save" later.
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn(
    '[cloudinary] Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env — ' +
      'photo uploads will fail until these are set (see backend/README.md).'
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/**
 * Uploads a photo (as a base64 data URI or a local file path) to Cloudinary,
 * inside a dedicated "randompick/people" folder so it's easy to find/manage.
 */
function uploadEntryPhoto(source) {
  return cloudinary.uploader.upload(source, {
    folder: 'randompick/people',
    resource_type: 'image',
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  });
}

function deleteEntryPhoto(publicId) {
  if (!publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { cloudinary, uploadEntryPhoto, deleteEntryPhoto };
