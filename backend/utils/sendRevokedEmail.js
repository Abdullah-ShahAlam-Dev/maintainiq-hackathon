const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ROLE_LABELS = {
  user: "User",
  technician: "Technician",
  admin: "Administrator",
  superadmin: "Super Administrator"
};

const sendRevokedEmail = async (mail, name, role) => {
  console.log("===== REVOKED EMAIL FUNCTION CALLED =====");

  const displayRole = ROLE_LABELS[role] || role;

  const msg = {
    to: mail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "MaintainIQ - Access Revoked",
    html: `
      <h2>Hello, ${name}</h2>

      <p>We're writing to inform you that your <strong>${displayRole}</strong> account access has been revoked.</p>

      <p>You will no longer be able to sign in to the MaintainIQ platform unless your access is granted again.</p>

      <p>If you believe this was unexpected, please contact the MaintainIQ administration team for further assistance.</p>

      <br>

      <p>Thank you.</p>

      <p><strong>MaintainIQ Team</strong></p>
    `
  };

  try {
    console.log("Sending Revoked email to:", mail);

    const [response] = await sgMail.send(msg);

    console.log(
      `[SendGrid] Revoked email sent to ${mail} — ${response.statusCode}`
    );

    return response;
  } catch (err) {
    console.error(
      `[SendGrid] FAILED to send Revoked email to ${mail}:`,
      err.response?.body || err.message
    );
  }
};

module.exports = { sendRevokedEmail };