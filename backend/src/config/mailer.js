const nodemailer = require('nodemailer');

// Sends mail through a regular Gmail account using an "app password"
// (myaccount.google.com/apppasswords) rather than the account's real
// password — Gmail no longer accepts real passwords for SMTP from
// third-party apps, and an app password can be revoked independently of the
// account password. Set these two in backend/.env:
//   GMAIL_USER=youraddress@gmail.com
//   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (16 chars, no spaces)
const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.warn(
    '[mailer] Missing GMAIL_USER / GMAIL_APP_PASSWORD in .env — OTP and ' +
      'password-reset emails will fail to send until these are set (see backend/README.md).'
  );
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

/**
 * Sends a one-time 6-digit code by email. `purpose` just changes the
 * wording — "verify" for new-account signup, "reset" for password resets.
 */
async function sendOtpEmail(toEmail, code, purpose) {
  const subject =
    purpose === 'reset' ? 'RandomPick password reset code' : 'Verify your RandomPick account';
  const heading =
    purpose === 'reset' ? 'Reset your password' : 'Verify your email';
  const body =
    purpose === 'reset'
      ? 'Use this code to reset your RandomPick password.'
      : 'Use this code to finish creating your RandomPick account.';

  await transporter.sendMail({
    from: `"RandomPick" <${GMAIL_USER}>`,
    to: toEmail,
    subject,
    text: `${heading}\n\n${body}\n\nCode: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1E1E2E;">${heading}</h2>
        <p style="color:#6B6B7B;">${body}</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color:#6C5CE7; margin: 24px 0;">${code}</p>
        <p style="color:#9B9BAE; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { transporter, sendOtpEmail };
