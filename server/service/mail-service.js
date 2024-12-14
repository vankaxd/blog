const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
const sendActivationMail = async (to, link) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Активация акканута на " + process.env.API_URL,
    text: "",
    html: `
        <h1>Активация аккаунта</h1>
        <p>Для активации вашего аккаунта перейдите по ссылке:</p>
        <a href="${link}">Активировать</a>
        `,
  });
};

module.exports = sendActivationMail;
