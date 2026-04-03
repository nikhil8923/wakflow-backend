import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "wakflowautomations@gmail.com",
    pass: "xwfhdoldqmjhffeq"
  }
});

export const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: "Wakflow <wakflowautomations@gmail.com>",
    to,
    subject,
    text
  });
};