const nodemailer = require('nodemailer');
//Global Scope for SMTP connection
const checkingSMTPEmail = nodemailer.createTransport({
  service: 'gmail',
    secure: false, // Port 587 ke liye isko false rakhna zaroori hai
  family: 4,
  auth: {
    user: process.env.PORTAL_EMAIL,
    pass: process.env.PORTAL_PASSWORD
  }
});

// const checkingSMTPEmail = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // Port 587 ke liye isko false rakhna zaroori hai
//   family: 4,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.PORTAL_PASSWORD,
//   },
// });

// Verify the SMTP connection once at startup so config problems (wrong
// password, App Password not set up, etc.) show up immediately in the logs
// instead of failing silently on the first real OTP email.
checkingSMTPEmail.verify((err) => {
  if (err) {
    console.error(
      '[Nodemailer] SMTP verification FAILED — OTP emails will not send. ' +
        'Most common cause: PORTAL_PASSWORD is your normal Gmail password instead ' +
        'of a 16-character Google App Password (requires 2FA enabled on the account). ' +
        'Generate one at https://myaccount.google.com/apppasswords',
      err.message
    );
  } else {
    console.log('[Nodemailer] SMTP connection verified — ready to send OTP emails');
  }
});

const sendOtpEmail = async (mail, otp, purpose = 'account verification') => {
  
  // // creating transporter Local Scope
  // // 1. Transporter ko function ke andar Rakhaa (Har Request = Naya Connection)



  const transporter = nodemailer.createTransport({
  service: 'gmail',
    secure: false, // Port 587 ke liye isko false rakhna zaroori hai
  family: 4,
  auth: {
    user: process.env.PORTAL_EMAIL,
    pass: process.env.PORTAL_PASSWORD
  }

  // const transporter = nodemailer.createTransport({
  // host: "smtp.gmail.com",
  // port: 587,
  // secure: false, // Port 587 ke liye isko false rakhna zaroori hai
  // family:4,
  // auth: {
  //   user: process.env.EMAIL_USER,
  //   pass: process.env.PORTAL_PASSWORD,
  // },
});







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
    // Log the FULL error (Gmail's rejection reason is in err.response / err.code),
    // then rethrow so the calling controller's catch block returns a real error
    // to the frontend instead of pretending the OTP was delivered.
    console.error(`[Nodemailer] FAILED to send OTP email to ${mail}:`, {
      message: err.message,
      code: err.code,
      response: err.response
    });
    throw new Error('Failed to send OTP email — please try again shortly');
  }
};

module.exports = { sendOtpEmail };
