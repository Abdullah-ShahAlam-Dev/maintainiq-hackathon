const { Resend } = require('resend');

// Resend sends over HTTPS (port 443), not raw SMTP — so it never hits the
// "shared cloud IP flagged by Gmail" problem that causes ETIMEDOUT on
// Render/Railway/Heroku. Sign up free at https://resend.com, verify a
// sending domain (or use their onboarding@resend.dev test address while you
// set that up), then set RESEND_API_KEY in your .env / Render dashboard.
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (mail, otp, purpose = 'account verification') => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'MaintainIQ <onboarding@resend.dev>',
      to: mail,
      subject: 'MaintainIQ — OTP Verification',
      text: `Your OTP for ${purpose} is: ${otp}\n\nThis code expires shortly. If you did not request this, you can ignore this email.`
    });

    if (error) {
      console.error(`[Resend] FAILED to send OTP email to ${mail}:`, error);
      throw new Error('Failed to send OTP email — please try again shortly');
    }

    console.log(`[Resend] OTP email sent to ${mail} — id: ${data.id}`);
    return data;
  } catch (err) {
    console.error(`[Resend] FAILED to send OTP email to ${mail}:`, err.message);
    throw new Error('Failed to send OTP email — please try again shortly');
  }
};

module.exports = { sendOtpEmail };
