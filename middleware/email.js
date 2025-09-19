const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendEmail = async (options) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.text, // plain‑text body
    html: options.html, // HTML body
  });

//   console.log("Message sent:", info.messageId);
};
