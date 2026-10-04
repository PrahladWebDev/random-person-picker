const mongoose = require('mongoose');

// One record per pick. Winners are stored as a name/photo snapshot (not a
// reference) so history stays correct even if the saved person is later
// renamed or deleted.
const historySchema = new mongoose.Schema(
  {
    winners: [
      {
        _id: false,
        name: { type: String, required: true, trim: true },
        imageUrl: { type: String },
      },
    ],
    poolSize: { type: Number, default: 0 },
    ownerId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('History', historySchema);
