require('dotenv').config();
const dns = require('dns');

// 1. Render ke ziddi server ko strictly IPv4 par lock karne ke liye:
dns.setDefaultResultOrder('ipv4first');

const nodemailer = require('nodemailer');

// 2. Global Transporter with IPv4 family lock:
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Port 587 ke liye false zaroori hai
  family: 4,     // Extra safety ke liye
  auth: {
    user: process.env.PORTAL_EMAIL,
    pass: process.env.PORTAL_PASSWORD,
  },
});

// Startup par connection verify
transporter.verify((err) => {
  if (err) {
    console.error('[Nodemailer] SMTP verification FAILED:', err.message);
  } else {
    console.log('[Nodemailer] SMTP connection verified — ready to send OTP emails');
  }
});

// Email send function
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
    console.error(`[Nodemailer] FAILED to send OTP email to ${mail}:`, err.message);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = { sendOtpEmail };