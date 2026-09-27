const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String }, // Cloudinary secure_url
    imagePublicId: { type: String }, // Cloudinary public_id, needed to delete/replace the photo
    // Identifies which account this entry belongs to (the signed-in user's
    // Mongo _id, as a string), so one account's saved names/photos never
    // show up for anyone else. Enforced in routes/people.js via requireAuth.
    ownerId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Entry', entrySchema);
