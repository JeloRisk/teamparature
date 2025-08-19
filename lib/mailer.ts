/*
================================================================================
/lib/mailer.ts (New File)
================================================================================
- Abstracts reusable email sending logic.
- Strongly typed parameters for better safety.
- Centralizes HTML + template building for maintainability.
- Added environment variable validation for reliability.
*/

import nodemailer from "nodemailer"

// Function parameter type
export interface SendVerificationEmailProps {
    name: string;
    email: string;
    token: string;
}

// Ensure required environment variables exist at runtime
function getEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: getEnvVar('GMAIL_USER'),
        pass: getEnvVar('GMAIL_APP_PASS'),
    },
});

/**
 * Sends a verification email to the user.
 * @param name - The user's display name.
 * @param email - The user's email address.
 * @param token - The unique verification token.
 */
export async function sendVerificationEmail({
    name,
    email,
    token,
}: SendVerificationEmailProps): Promise<void> {
    const baseUrl = getEnvVar('NEXT_PUBLIC_BASE_URL');
    const verifyLink = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    const htmlContent = `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    
    <!-- Header with logo -->
    <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
      <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Teamparature" style="height: 50px; margin-bottom: 10px;" />
      <h1 style="margin: 0; font-size: 24px;">Verify Your Teamparature Account</h1>
    </div>

    <!-- Body -->
    <div style="padding: 30px;">
      <h2 style="font-size: 20px; color: #3B82F6;">Hello, ${name}!</h2>
      <p>Thank you for joining Teamparature. Click the button below to verify your email and complete your setup.</p>

      <!-- Verification Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyLink}" 
           style="background-color: #F97316; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-size: 16px; font-weight: bold;">
          Verify Email
        </a>
      </div>

      <p>This verification link is valid for 1 hour.</p>
      <p>If you did not create an account, no action is needed.</p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f7f7f7; color: #777; padding: 20px; text-align: center; font-size: 12px;">
      <p>If you're having trouble with the button, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all;">${verifyLink}</p>
      <p>&copy; ${new Date().getFullYear()} Teamparature. All rights reserved.</p>
    </div>
  </div>
</div>
`;


    await transporter.sendMail({
        from: `"Teamparature Support" <${getEnvVar('GMAIL_USER')}>`,
        to: email,
        subject: 'Verify your email address',
        html: htmlContent,
    });
}
