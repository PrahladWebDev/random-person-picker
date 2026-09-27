const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { sendOtpEmail } = require('../config/mailer');
const { generateOtpCode, hashOtpCode, otpExpiryDate, MAX_OTP_ATTEMPTS } = require('../utils/otp');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function publicUser(user) {
  return { id: user._id.toString(), email: user.email };
}

async function issueOtp(user, purpose) {
  const code = generateOtpCode();
  user.otpCodeHash = hashOtpCode(code);
  user.otpExpiresAt = otpExpiryDate();
  user.otpPurpose = purpose;
  user.otpAttempts = 0;
  await user.save();
  await sendOtpEmail(user.email, code, purpose);
}

// POST /api/auth/register — create an account and email a 6-digit code that
// must be verified (via /verify-email) before the account can sign in.
router.post('/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (user) {
      // Unverified account from an earlier, abandoned signup — treat this
      // as resuming it rather than blocking on a duplicate-email error.
      user.passwordHash = passwordHash;
    } else {
      user = new User({ email, passwordHash, isVerified: false });
    }

    await issueOtp(user, 'verify');
    res.status(201).json({ message: 'Verification code sent to your email.', email });
  } catch (err) {
    console.error('POST /api/auth/register failed:', err);
    res.status(500).json({ error: 'Failed to register. Please try again.' });
  }
});

// POST /api/auth/verify-email — confirm the code sent by /register, then
// sign the user in (returns a token, same as /login).
router.post('/verify-email', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otpPurpose !== 'verify' || !user.otpCodeHash) {
      return res.status(400).json({ error: 'Request a new verification code and try again.' });
    }
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'That code has expired. Request a new one.' });
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(400).json({ error: 'Too many attempts. Request a new code.' });
    }
    if (hashOtpCode(String(code || '')) !== user.otpCodeHash) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Incorrect code. Please try again.' });
    }

    user.isVerified = true;
    user.otpCodeHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    user.otpAttempts = 0;
    await user.save();

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('POST /api/auth/verify-email failed:', err);
    res.status(500).json({ error: 'Failed to verify email. Please try again.' });
  }
});

// POST /api/auth/resend-verification — issue a fresh code for an
// unverified account (e.g. the first one expired or was never delivered).
router.post('/resend-verification', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: 'No account found for that email.' });
    if (user.isVerified) {
      return res.status(400).json({ error: 'This account is already verified. Try logging in.' });
    }

    await issueOtp(user, 'verify');
    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('POST /api/auth/resend-verification failed:', err);
    res.status(500).json({ error: 'Failed to send code. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const user = await User.findOne({ email });

    // Same generic message whether the email doesn't exist or the password
    // is wrong, so a caller can't use this endpoint to discover which
    // emails have accounts.
    const invalidMessage = 'Incorrect email or password.';
    if (!user) return res.status(401).json({ error: invalidMessage });

    const passwordOk = await bcrypt.compare(password || '', user.passwordHash);
    if (!passwordOk) return res.status(401).json({ error: invalidMessage });

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('POST /api/auth/login failed:', err);
    res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// POST /api/auth/forgot-password — email a reset code. Always responds
// with the same success message whether or not the email has an account,
// so this can't be used to enumerate registered emails.
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const genericResponse = {
      message: 'If an account exists for that email, a reset code has been sent.',
    };

    if (!EMAIL_RE.test(email)) return res.json(genericResponse);

    const user = await User.findOne({ email });
    if (user) {
      await issueOtp(user, 'reset');
    }
    res.json(genericResponse);
  } catch (err) {
    console.error('POST /api/auth/forgot-password failed:', err);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
});

// POST /api/auth/reset-password — verify the reset code and set a new
// password in one step.
router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email });
    if (!user || user.otpPurpose !== 'reset' || !user.otpCodeHash) {
      return res.status(400).json({ error: 'Request a new reset code and try again.' });
    }
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'That code has expired. Request a new one.' });
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(400).json({ error: 'Too many attempts. Request a new code.' });
    }
    if (hashOtpCode(String(code || '')) !== user.otpCodeHash) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Incorrect code. Please try again.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.isVerified = true; // a successful reset also proves the email is live
    user.otpCodeHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    user.otpAttempts = 0;
    await user.save();

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('POST /api/auth/reset-password failed:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

module.exports = router;
