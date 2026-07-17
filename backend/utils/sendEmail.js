const nodemailer = require('nodemailer');

// 1. Ek hi Global Transporter banayen (Verify aur Send dono ke liye)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Port 587 ke liye isko false rakhna zaroori hai
  family: 4,     // Render par IPv6 block karne ke liye
  auth: {
    user: process.env.PORTAL_EMAIL,
    pass: process.env.PORTAL_PASSWORD,
  },
});

// 2. Startup par connection verify karein
transporter.verify((err) => {
  if (err) {
    console.error(
      '[Nodemailer] SMTP verification FAILED — OTP emails will not send. ' +
      'Most common cause: PORTAL_PASSWORD is your normal Gmail password instead ' +
      'of a 16-character Google App Password.',
      err.message
    );
  } else {
    console.log('[Nodemailer] SMTP connection verified — ready to send OTP emails');
  }
});

// 3. Email send karne ka function
const sendOtpEmail = async (mail, otp, purpose = 'account verification') => {
  const mailOptions = {
    from: process.env.PORTAL_EMAIL,
    to: mail,
    subject: 'MaintainIQ — OTP Verification',
    text: `Your OTP for ${purpose} is: ${otp}\n\nThis code expires shortly. If you did not request this, you can ignore this email.`
  };

  try {
    // Wahi same global transporter yahan use ho raha hai
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] OTP email sent to ${mail} — messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[Nodemailer] FAILED to send OTP email to ${mail}:`, {
      message: err.message,
      code: err.code
    });
    throw new Error('Failed to send OTP email — please try again shortly');
  }
};

module.exports = { sendOtpEmail };