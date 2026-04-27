import nodemailer from "nodemailer";
import { logger } from "./logger";

let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  logger.info({ host: process.env.SMTP_HOST }, "SMTP transport configured");
} else {
  logger.warn("SMTP not configured — emails will be logged to console only");
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; previewCode?: string }> {
  if (!transporter) {
    logger.info({ to: opts.to, subject: opts.subject, body: opts.text }, "[EMAIL DEV MODE] Would send:");
    return { sent: false };
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `ParkNow <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { sent: true };
  } catch (err) {
    logger.error({ err }, "Failed to send email");
    return { sent: false };
  }
}

export const emailEnabled = transporter !== null;
