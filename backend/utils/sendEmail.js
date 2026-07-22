const sgMail = require('@sendgrid/mail');

// SendGrid, using Single Sender Verification instead of full domain
// verification — this works without owning a domain (unlike Resend/Mailgun
// which require DNS records on a domain you control). You verify ONE email
// address (e.g. your Gmail) in the SendGrid dashboard, then send FROM that
// address TO any recipient.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (mail, otp, purpose = 'account verification') => {
  const msg = {
    to: mail,
    from: process.env.SENDGRID_FROM_EMAIL, // must be the exact verified single sender address
    subject: 'Maintain-IQ — OTP Verification',
    text: `Your OTP for ${purpose} is: ${otp}\n\nThis code expires shortly. If you did not request this, you can ignore this email.`
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(`[SendGrid] OTP email sent to ${mail} — status: ${response.statusCode}`);
    return response;
  } catch (err) {
    // SendGrid puts the real rejection reason in err.response.body — log it
    // in full, since "Invalid login"-style vague errors are exactly what
    // caused the silent-failure problem before.
    console.error(`[SendGrid] FAILED to send OTP email to ${mail}:`, err.response?.body || err.message);
    throw new Error('Failed to send OTP email — please try again shortly');
  }
};

module.exports = { sendOtpEmail };