const mongoose = require('mongoose');

// A named set of saved people ("Family", "Office team") so a whole group can
// be loaded in one tap. memberIds are Entry _ids (as strings).
const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    memberIds: { type: [String], default: [] },
    ownerId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
