const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ROLE_LABELS = {
  admin: "Administrator",
  technician: "Technician",
};

const sendPendingEmail = async (mail, name, role) => {
  console.log("===== PENDING EMAIL FUNCTION CALLED =====");

  const displayRole = ROLE_LABELS[role] || role;
  const article = role === "admin" ? "an" : "a"; //role internal avable hi so uses local scope

  const technicianSection =
    role === "technician"
      ? `
        <p>We have successfully received your application along with your supporting document.</p>
      `
      : `
        <p>We have successfully received your application.</p>
      `;

  const msg = {
    to: mail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "📋 MaintainIQ - Application Received",
    html: `
      <h2>Welcome, ${name}! 👋</h2>

      <p>Thank you for applying as ${article} <strong>${displayRole}</strong>.</p>

      ${technicianSection}

      <p>Our administration team will review your submission for the <strong>${displayRole}</strong> role.</p>

      <p>You'll be notified by email as soon as the review process is complete.</p>

      <br>

      <p>Thank you for choosing <strong>MaintainIQ</strong>.</p>

      <p><strong>MaintainIQ Team</strong></p>
    `,
  };

  try {
    console.log("Sending Pending email to:", mail);

    const [response] = await sgMail.send(msg);

    console.log(
      `[SendGrid] Pending email sent to ${mail} — ${response.statusCode}`,
    );

    return response;
  } catch (err) {
    console.error(
      `[SendGrid] FAILED to send Pending email to ${mail}:`,
      err.response?.body || err.message,
    );
  }
};

module.exports = { sendPendingEmail };
