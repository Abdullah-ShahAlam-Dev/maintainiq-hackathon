const nodemailer = require('nodemailer');

// NOTE: This is the Gmail-SMTP fallback, kept only in case you can't switch
// to Resend right away. It does NOT fix the underlying "Gmail throttles
// Render's shared outbound IPs" problem — it just:
//   1. Reuses ONE pooled transporter instead of creating a new TCP/TLS
//      connection on every OTP send (the previous file's actual bug).
//   2. Fails in ~10s instead of hanging for 2 minutes, via explicit timeouts.
// If you still see ETIMEDOUT with this version, that confirms it's Gmail/IP
// throttling, not your code — switch to sendEmail.js (Resend) permanently.

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  maxConnections: 1,
  auth: {
    user: process.env.PORTAL_EMAIL,
    pass: process.env.PORTAL_PASSWORD
  },
  connectionTimeout: 10000, // 10s instead of the platform default (~2min)
  greetingTimeout: 10000,
  socketTimeout: 10000
});

transporter.verify((err) => {
  if (err) {
    console.error('[Nodemailer] SMTP verification FAILED:', err.message);
  } else {
    console.log('[Nodemailer] SMTP connection verified — ready to send OTP emails');
  }
});

const sendOtpEmail = async (mail, otp, purpose = 'account verification') => {
  const mailOptions = {
    from: process.env.PORTAL_EMAIL,
    to: mail,
    subject: 'MaintainIQ — OTP Verification',
    text: `Your OTP for ${purpose} is: ${otp}\n\nThis code expires shortly. If you did not request this, you can ignore this email.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] OTP email sent to ${mail} — messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[Nodemailer] FAILED to send OTP email to ${mail}:`, {
      message: err.message,
      code: err.code,
      response: err.response
    });
    throw new Error('Failed to send OTP email — please try again shortly');
  }
};

module.exports = { sendOtpEmail };
