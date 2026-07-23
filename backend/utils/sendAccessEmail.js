const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ROLE_LABELS = {
  user: "User",
  technician: "Technician",
  admin: "Administrator",
  superadmin: "Super Administrator"
};

const sendAccessGrantedEmail = async (mail, name, role) => {
  console.log("===== ACCESS EMAIL FUNCTION CALLED =====");
  const displayRole = ROLE_LABELS[role] || role;
  const msg = {
    to: mail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "🎉 Welcome to MaintainIQ - Access Granted",
    html: `
      <h2>Congratulations, ${name}! 🎉</h2>

      <p>Your account has been approved.</p>

      <p>You are now officially part of the <strong>MaintainIQ Team</strong>.</p>

      <p><strong>Role:</strong> ${displayRole}</p>

      <p>You can now login and start using the platform.</p>

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

      <p>Thank you,<br><strong>Team MaintainIQ</strong></p>
    `
  };

  try {
    console.log("Sending Access email to:", mail);
    const [response] = await sgMail.send(msg);

    console.log(
      `[SendGrid] Access Granted email sent to ${mail} — ${response.statusCode}`
    );

    return response;
  } catch (err) {
    console.error(
      `[SendGrid] FAILED to send Access Granted email to ${mail}:`,
      err.response?.body || err.message
    );
  }
};

module.exports = { sendAccessGrantedEmail };