const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String }, // Cloudinary secure_url
    imagePublicId: { type: String }, // Cloudinary public_id, needed to delete/replace the photo
  },
  { timestamps: true }
);

module.exports = mongoose.model('Entry', entrySchema);
