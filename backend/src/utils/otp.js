const crypto = require('crypto');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

/** Generates a random 6-digit code, e.g. "042817". */
function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

// OTPs are stored hashed (not plaintext) so a database read/leak doesn't
// hand out live codes — same reasoning as hashing passwords, just with a
// cheaper hash since these expire in minutes and are only 6 digits anyway.
function hashOtpCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function otpExpiryDate() {
  return new Date(Date.now() + OTP_TTL_MS);
}

module.exports = { generateOtpCode, hashOtpCode, otpExpiryDate, MAX_OTP_ATTEMPTS };
