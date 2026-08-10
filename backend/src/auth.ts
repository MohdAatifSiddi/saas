import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Resend } from 'resend';
import { PrismaClient } from './generated/prisma/client';

const isProduction = process.env.NODE_ENV === 'production';
const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

// Fail fast in production if transactional email delivery relies on unconfigured state
if (isProduction && (!resendApiKey || !emailFrom)) {
  throw new Error(
    'CRITICAL: Production startup failed. RESEND_API_KEY and EMAIL_FROM environment variables must be securely configured.',
  );
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Isolated transactional email dispatcher
async function sendTransactionalEmail(
  to: string,
  subject: string,
  html: string,
) {
  if (!resend || !emailFrom) {
    throw new Error('Email configuration is missing or invalid.');
  }
  try {
    const result = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });
    if (result.error) {
      throw new Error('FAILED_TO_SEND_EMAIL');
    }
  } catch {
    // Deliberately hiding internal stack traces, API keys, and exact failure states.
    // The user's PII (email) is also not logged here for compliance reasons.
    throw new Error('FAILED_TO_SEND_EMAIL');
  }
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Validate the URL generated natively by Better Auth exists. We do not construct security tokens manually.
      if (!url) {
        throw new Error('INVALID_RESET_URL');
      }

      // Exact token expiration bounds are managed dynamically by Better Auth's core internals. We use appropriate generic verbiage here.
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 24px;">Reset your password</h2>
          <p>We received a request to reset your password for your SaaS Platform account. You can update your password by clicking the secure button below:</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #71717a; font-size: 14px; margin-top: 32px;">This secure password reset link will expire shortly.</p>
          <p style="color: #ef4444; font-size: 14px; font-weight: 500;">Security Warning: If you did not request a password reset, please secure your account immediately and ignore this email.</p>
          <p style="color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 32px;">&copy; ${new Date().getFullYear()} SaaS Platform. All rights reserved.</p>
        </div>
      `;
      await sendTransactionalEmail(
        user.email,
        'Reset your password — SaaS Platform',
        htmlContent,
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (!url) {
        throw new Error('INVALID_VERIFICATION_URL');
      }

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 24px;">Verify your email address</h2>
          <p>Thank you for signing up for SaaS Platform! To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #71717a; font-size: 14px; margin-top: 32px;">This secure verification link will expire shortly.</p>
          <p style="color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 32px;">If you did not create an account on SaaS Platform, please ignore this email.</p>
        </div>
      `;
      await sendTransactionalEmail(
        user.email,
        'Verify your email address — SaaS Platform',
        htmlContent,
      );
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '',
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'apple'],
    },
  },
  rateLimit: {
    window: 60,
    max: 100, // Strict IP-based throttling for credential-stuffing prevention
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: 'saas-platform',
  },
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
});
