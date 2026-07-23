const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const CABINET_EMAIL = process.env.CABINET_EMAIL || "contact@prestigecenterconsulting.bj";

async function sendMail({ to, bcc, subject, text, attachments }) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    bcc: bcc || CABINET_EMAIL,
    subject,
    text,
    attachments,
  });
}

module.exports = { sendMail, transporter, CABINET_EMAIL };
