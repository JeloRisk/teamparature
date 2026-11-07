
import "server-only";
import nodemailer from "nodemailer";
import { randomBytes } from "node:crypto";

/**
 * Teamparature Organization Invitation Mailer
 *
 * Email provider: Gmail SMTP
 * Authentication: Google App Password
 * Invitation validity: 24 hours (enforced by backend)
 */

export interface SendOrgInvitationEmailProps {
  inviterName: string;
  inviteeEmail: string;
  orgName: string;
  token: string;
}

function getEnvVar(key: string): string {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getInvitationTransport() {
  const user = getEnvVar("GMAIL_USER");

  const pass = getEnvVar("GMAIL_APP_PASS")
    .replace(/\s/g, "");

  if (pass.length !== 16) {
    throw new Error(
      "GMAIL_APP_PASS must be a 16-character Google App Password."
    );
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return { transporter, from: user };
}

/**
 * Verify Gmail SMTP authentication.
 * Useful for troubleshooting.
 */
export async function verifyInvitationEmailConnection() {
  const { transporter } = getInvitationTransport();

  try {
    await transporter.verify();
    console.log("[Teamparature Mailer] SMTP connection verified");
    return true;
  } catch (error) {
    console.error("[Teamparature Mailer] SMTP verification failed", {
      code: (error as { code?: string }).code,
      responseCode: (error as { responseCode?: number }).responseCode,
    });

    return false;
  } finally {
    transporter.close();
  }
}

/**
 * Generate a secure invitation token.
 *
 * Store only its SHA-256 hash in the database.
 * The invitation API must enforce 24-hour expiration.
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Send an organization invitation email.
 */
export async function sendOrgInvitationEmail({
  inviterName,
  inviteeEmail,
  orgName,
  token,
}: SendOrgInvitationEmailProps): Promise<void> {
  const { transporter, from } = getInvitationTransport();

  const baseUrl = getEnvVar("NEXT_PUBLIC_APP_URL")
    .replace(/\/+$/, "");

  const inviteUrl = new URL(
    "/invitations/accept",
    baseUrl
  );

  inviteUrl.searchParams.set("token", token);

  const inviteLink = inviteUrl.toString();

  const safeOrgName = escapeHtml(orgName);
  const safeInviterName = escapeHtml(inviterName);
  const safeInviteLink = escapeHtml(inviteLink);

  const logoUrl = escapeHtml(
    new URL("/logo.png", baseUrl).toString()
  );

  const subject =
    `You're invited to join ${orgName} on Teamparature`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0" />
  <title>Teamparature Invitation</title>
</head>

<body style="
  margin:0;
  padding:30px 12px;
  background:#f3f6fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#334155;
">

  <div style="
    max-width:600px;
    margin:0 auto;
    background:#ffffff;
    border:1px solid #e2e8f0;
    border-radius:12px;
    overflow:hidden;
  ">

    <!-- HEADER -->
    <div style="
      background:#3B82F6;
      padding:32px 24px;
      text-align:center;
      color:#ffffff;
    ">

      <img
        src="${logoUrl}"
        alt="Teamparature"
        width="56"
        style="
          display:block;
          margin:0 auto 16px;
          max-width:56px;
        "
      />

      <h1 style="
        margin:0;
        font-size:24px;
        line-height:1.4;
      ">
        You're Invited!
      </h1>

      <p style="
        margin:10px 0 0;
        font-size:15px;
        color:#eff6ff;
      ">
        Join your team on Teamparature
      </p>

    </div>

    <!-- BODY -->
    <div style="padding:36px 30px;">

      <h2 style="
        margin:0 0 16px;
        font-size:21px;
        color:#1e293b;
      ">
        Hello there!
      </h2>

      <p style="
        font-size:15px;
        line-height:1.8;
      ">
        <strong>${safeInviterName}</strong>
        has invited you to join
        <strong>${safeOrgName}</strong>
        on Teamparature.
      </p>

      <p style="
        font-size:15px;
        line-height:1.8;
      ">
        Connect with your team, share how you're
        feeling, and contribute to a healthier
        workplace experience.
      </p>

      <!-- INVITATION BUTTON -->
      <div style="
        text-align:center;
        margin:36px 0;
      ">

        <a
          href="${safeInviteLink}"
          style="
            display:inline-block;
            background:#F97316;
            color:#ffffff;
            text-decoration:none;
            padding:15px 32px;
            border-radius:8px;
            font-size:16px;
            font-weight:bold;
          "
        >
          Accept Invitation
        </a>

      </div>

      <!-- EXPIRATION NOTICE -->
      <div style="
        background:#eff6ff;
        border-left:4px solid #3B82F6;
        border-radius:6px;
        padding:16px;
        margin-top:24px;
      ">

        <p style="
          margin:0;
          font-size:14px;
          color:#1e40af;
        ">
          This invitation link expires in
          <strong>24 hours</strong>.
        </p>

      </div>

      <p style="
        margin-top:24px;
        font-size:14px;
        line-height:1.7;
        color:#64748b;
      ">
        Don't have a Teamparature account yet?
        You can create one when accepting
        your invitation.
      </p>

    </div>

    <!-- FOOTER -->
    <div style="
      background:#f8fafc;
      padding:24px 30px;
      border-top:1px solid #e2e8f0;
    ">

      <p style="
        font-size:12px;
        color:#64748b;
        margin:0 0 10px;
      ">
        If the button doesn't work,
        copy and paste this link:
      </p>

      <p style="
        font-size:12px;
        overflow-wrap:anywhere;
        margin:0 0 20px;
      ">
        <a
          href="${safeInviteLink}"
          style="color:#2563eb;"
        >
          ${safeInviteLink}
        </a>
      </p>

      <p style="
        margin:0;
        font-size:12px;
        color:#94a3b8;
        text-align:center;
      ">
        &copy; ${new Date().getFullYear()}
        Teamparature. All rights reserved.
      </p>

    </div>

  </div>

</body>
</html>
`;

  const textContent = `
You're Invited to Teamparature!

Hello!

${inviterName} has invited you to join
${orgName} on Teamparature.

Accept your invitation:
${inviteLink}

This invitation expires in 24 hours.

If you don't have an account yet,
you can create one when accepting the invitation.

Teamparature
`;

  try {
    const info = await transporter.sendMail({
      from: {
        name: "Teamparature Invitations",
        address: from,
      },
      to: inviteeEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log("[Teamparature Mailer] Invitation sent", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    const mailError = error as {
      code?: string;
      responseCode?: number;
    };

    console.error("[Teamparature Mailer] Delivery failed", {
      code: mailError.code,
      responseCode: mailError.responseCode,
    });

    if (
      mailError.code === "EAUTH" ||
      mailError.responseCode === 535
    ) {
      throw new Error(
        "Gmail SMTP authentication failed. " +
        "Verify GMAIL_USER and GMAIL_APP_PASS, " +
        "and ensure the App Password belongs " +
        "to the same Google account."
      );
    }

    throw new Error(
      "Unable to send organization invitation email."
    );
  } finally {
    transporter.close();
  }
}
