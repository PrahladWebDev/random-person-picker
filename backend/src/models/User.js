const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, default: false },

    // Set when registering (to verify the email) or requesting a password
    // reset. Re-used for both flows since only one is ever in progress at a
    // time; `purpose` says which one a given code is valid for so a
    // registration OTP can't be replayed to reset a password, or vice versa.
    otpCodeHash: { type: String },
    otpExpiresAt: { type: Date },
    otpPurpose: { type: String, enum: ['verify', 'reset'] },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
