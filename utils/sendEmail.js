import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  console.log("🚀 EMAIL FUNCTION STARTED");

  try {
    console.log("Using EMAIL_USER:", process.env.EMAIL_USER);
    console.log("Using EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });

    console.log("✅ EMAIL SENT:", info.response);

  } catch (error) {
    console.log("❌ EMAIL ERROR:", error);
  }
};
