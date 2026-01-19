import nodemailer from 'nodemailer';
import mustache from 'mustache';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';

// --- 1. Constants & Config ---
const ASSETS_PATH = join(__dirname, '../../assets/email');
const FROM_EMAIL = process.env.SMTP_FROM || 'no-reply@invoice-system.local';

// --- 2. Template Definitions ---
type EmailTemplateData = {
  html: string;
  text: string;
  validator: z.ZodType;
};

export const emailTemplates = {
  userCredentials: {
    html: readFileSync(join(ASSETS_PATH, 'user-credentials.html'), 'utf-8'),
    text: readFileSync(join(ASSETS_PATH, 'user-credentials.txt'), 'utf-8'),
    validator: z.object({
      recipientName: z.string().min(1),
      emailTo: z.string().email(),
      password: z.string().min(1),
      loginLink: z.string().url(),
    }),
  } satisfies EmailTemplateData,
};

export type EmailTemplateKey = keyof typeof emailTemplates;

// --- 3. Transporter Setup (FIXED) ---
// We use 'any' here to prevent TypeScript from complaining about 'host' 
// not existing on the generic TransportOptions union type.
const smtpConfig: any = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: process.env.SMTP_SECURE === 'true',
  tls: { rejectUnauthorized: false },
};

// Only add authentication if a user is explicitly defined
if (process.env.SMTP_USER) {
  smtpConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || '',
  };
}

const transporter = nodemailer.createTransport(smtpConfig);

// --- 4. Main Service Function ---
export const sendEmail = async <T extends EmailTemplateKey>(
  recipient: string,
  subject: string,
  template: T,
  data: z.infer<typeof emailTemplates[T]['validator']>
) => {
  try {
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) throw new Error(`Template ${template} not found`);

    // Validate Data
    const validation = emailTemplate.validator.safeParse(data);
    if (!validation.success) {
      console.error('Email Data Validation Failed:', validation.error);
      return false;
    }
    const validatedData = validation.data;

    // Common Data
    const view = {
      ...validatedData,
      year: new Date().getFullYear(),
    };

    // Render
    const html = mustache.render(emailTemplate.html, view);
    const text = mustache.render(emailTemplate.text, view);

    // Send
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipient,
      subject,
      html,
      text,
    });

    console.log(`📧 Email sent to ${recipient}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};