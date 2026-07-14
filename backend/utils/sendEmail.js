const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.PORTAL_EMAIL,
    pass: process.env.PORTAL_PASSWORD
  }
});

const sendOtpEmail = async (mail, otp, purpose = 'account verification') => {
  const mailOptions = {
    from: process.env.PORTAL_EMAIL,
    to: mail,
    subject: 'MaintainIQ — OTP Verification',
    text: `Your OTP for ${purpose} is: ${otp}\n\nThis code expires shortly. If you did not request this, you can ignore this email.`
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
