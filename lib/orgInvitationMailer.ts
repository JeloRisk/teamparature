/*
================================================================================
/lib/orgInvitationMailer.ts (New File)
================================================================================
- Sends organization invitation emails.
- Uses Nodemailer with Gmail credentials (or SMTP).
- Invitation links expire in 1 day (token expiration must be enforced in DB).
- Themed for Teamparature (Orange + Blue).
================================================================================
*/

import nodemailer from "nodemailer";

// Function parameter type
export interface SendOrgInvitationEmailProps {
    inviterName: string;
    inviteeEmail: string;
    orgName: string;
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
    service: "gmail",
    auth: {
        user: getEnvVar("GMAIL_USER"),
        pass: getEnvVar("GMAIL_APP_PASS"),
    },
});

/**
 * Sends an organization invitation email.
 * @param inviterName - The name of the person sending the invite.
 * @param inviteeEmail - The recipient’s email.
 * @param orgName - The organization’s name.
 * @param token - The unique invitation token.
 */
export async function sendOrgInvitationEmail({
    inviterName,
    inviteeEmail,
    orgName,
    token,
}: SendOrgInvitationEmailProps): Promise<void> {
    const baseUrl = getEnvVar("NEXT_PUBLIC_BASE_URL");
    const inviteLink = `${baseUrl}/invitations/accept?token=${encodeURIComponent(
        token
    )}`;

    const htmlContent = `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">

    <!-- Header -->
    <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
      <img src="${process.env.NEXT_PUBLIC_APP_URL
        }/logo.png" alt="Teamparature" style="height: 50px; margin-bottom: 10px;" />
      <h1 style="margin: 0; font-size: 22px;">You're Invited to Join ${orgName}</h1>
    </div>

    <!-- Body -->
    <div style="padding: 30px;">
      <h2 style="font-size: 18px; color: #3B82F6;">Hello!</h2>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Teamparature.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}"
           style="background-color: #F97316; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
          Accept Invitation
        </a>
      </div>

      <p>This invitation link will expire in <strong>24 hours</strong>.</p>
      <p>If you don’t have an account yet, you’ll be prompted to create one before joining.</p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f7f7f7; color: #777; padding: 20px; text-align: center; font-size: 12px;">
      <p>If the button doesn’t work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all;">${inviteLink}</p>
      <p>&copy; ${new Date().getFullYear()} Teamparature. All rights reserved.</p>
    </div>
  </div>
</div>
`;

    await transporter.sendMail({
        from: `"Teamparature Invitations" <${getEnvVar("GMAIL_USER")}>`,
        to: inviteeEmail,
        subject: `You're invited to join ${orgName} on Teamparature`,
        html: htmlContent,
    });
}
