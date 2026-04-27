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
    // SECURITY: never log the email body — it may contain OTPs, password reset
    // codes, or other sensitive material. Log metadata only.
    if (process.env.NODE_ENV === "production") {
      logger.error(
        { to: opts.to, subject: opts.subject },
        "[EMAIL] SMTP not configured in production — email NOT sent",
      );
    } else {
      logger.info(
        { to: opts.to, subject: opts.subject },
        "[EMAIL DEV MODE] Would send (body redacted; use API response devCode for testing)",
      );
    }
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
    logger.error({ err, to: opts.to, subject: opts.subject }, "Failed to send email");
    return { sent: false };
  }
}

export const emailEnabled = transporter !== null;
