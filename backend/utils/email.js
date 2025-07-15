import nodemailer from "nodemailer";
import pug from "pug";
import { htmlToText } from "html-to-text";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Email {
  constructor(user, url) {
    this.to = user.email;
    this.username = user.username;
    this.url = url;
    this.from = `XPStrength Support <${process.env.EMAIL_FROM}>`;
  }

  async newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      name: this.username,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    const tranport = await this.newTransport();

    await tranport.sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to XPStrength");
  }

  async sendForgotPassword() {
    return this.send(
      "forgotPassword",
      "Your password reset token (valid for 5 min)"
    );
  }

  async sendForgotUsername() {
    return this.send("forgotUsername", "Username Request");
  }
}

export default Email;
