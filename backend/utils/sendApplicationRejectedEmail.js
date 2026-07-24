const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ROLE_LABELS = {
  user: "User",
  technician: "Technician",
  admin: "Administrator",
  superadmin: "Super Administrator",
};

const sendApplicationRejectedEmail = async (mail, name, role) => {
  const displayRole = ROLE_LABELS[role] || role;

  const article = role === "admin" ? "an" : "a";

  const msg = {
    to: mail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "Application Status Update - MaintainIQ",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
        <h2 style="color:#d32f2f;">Application Status Update</h2>

        <p>Dear <strong>${name}</strong>,</p>

        <p>
          Thank you for applying as ${article}
          <strong>${displayRole}</strong> at
          <strong>MaintainIQ</strong>.
        </p>

        <p>
          After carefully reviewing your application, we regret to inform you
          that it has not been approved at this time.
        </p>

        <p>
          If your application was rejected due to missing or incorrect
          information, you are welcome to submit a new application with the
          correct details and supporting documents.
        </p>

        <p>
          We appreciate your interest in MaintainIQ and thank you for your
          time.
        </p>

        <p>
          Best regards,<br />
          <strong>MaintainIQ Team</strong>
        </p>
      </div>
    `,
  };

  await sgMail.send(msg);
};

module.exports = { sendApplicationRejectedEmail };