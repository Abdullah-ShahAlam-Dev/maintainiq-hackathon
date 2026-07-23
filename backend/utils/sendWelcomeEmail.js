const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = async (mail, name) => {
  console.log("===== WELCOME EMAIL FUNCTION CALLED =====");

  const msg = {
    to: mail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "🎉 Welcome to MaintainIQ",
    html: `
      <h2>Welcome, ${name}! 👋</h2>

      <p>Thank you for creating your <strong>MaintainIQ</strong> account.</p>

      <p>Your account has been successfully created, and you can now sign in to start using the platform.</p>

      <br>

      <a
        href="${process.env.FRONTEND_URL}/login"
        style="
          background:#f97316;
          color:#fff;
          padding:12px 20px;
          text-decoration:none;
          border-radius:6px;
          display:inline-block;
        "
      >
        Login to MaintainIQ
      </a>

      <br><br>

      <p>We're excited to have you on board.</p>

      <p>Thank you,<br><strong>MaintainIQ Team</strong></p>
    `
  };

  try {
    console.log("Sending Welcome email to:", mail);

    const [response] = await sgMail.send(msg);

    console.log(
      `[SendGrid] Welcome email sent to ${mail} — ${response.statusCode}`
    );

    return response;
  } catch (err) {
    console.error(
      `[SendGrid] FAILED to send Welcome email to ${mail}:`,
      err.response?.body || err.message
    );
  }
};

module.exports = { sendWelcomeEmail };