import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Invitation from "@/models/Invitation";
import { sendOrgInvitationEmail } from "@/lib/orgInvitationMailer";
import User from "@/models/User";
import { Organization } from "@/models/Organization";
import { Membership } from "@/models/Membership";
import { requirePermission } from "@/lib/rbac";

// You cannot type the second argument directly. Use URL pattern instead.
export async function POST(req: Request) {
    try {
        await connectDB();

        // Extract orgId from the URL
        const url = new URL(req.url);
        const orgId = url.pathname.split("/")[3]; // app/api/orgs/[orgId]/invite

        const { email, role } = await req.json();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const inviter = await User.findById(session.user.id);
        if (!inviter)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        const org = await Organization.findById(orgId);
        if (!org)
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });

        // Permission check
        const permissionCheck = await requirePermission(session.user.id, orgId, "invite_member");
        if (permissionCheck instanceof NextResponse) return permissionCheck;

        // Check existing user & membership
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const existingMembership = await Membership.findOne({
                user: existingUser._id,
                organization: orgId,
                isActive: true,
            });
            if (existingMembership) {
                return NextResponse.json(
                    { error: "User is already part of this organization" },
                    { status: 400 }
                );
            }
        }

        // Check pending invitation
        const existingInvitation = await Invitation.findOne({
            organization: orgId,
            email,
            status: "pending",
            $or: [
                { expiresAt: { $gt: new Date() } },
                { expiresAt: { $exists: false }, createdAt: { $gt: new Date(Date.now() - 86400000) } },
            ],
        });
        if (existingInvitation) {
            return NextResponse.json(
                { error: "An active invitation already exists for this user" },
                { status: 400 }
            );
        }

        // Create token & invitation
        const token = crypto.randomBytes(32).toString("hex");

        const invitation = await Invitation.create({
            organization: orgId,
            email,
            role: role || "member",
            invitedBy: inviter._id,
            token,
            status: "pending",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        try {
            await sendOrgInvitationEmail({
                inviterName: inviter.firstName || inviter.email,
                inviteeEmail: email,
                orgName: org.name,
                token,
            });
        } catch (error) {
            console.error("Invitation email delivery failed:", error);
            await Invitation.deleteOne({ _id: invitation._id, status: "pending" });
            return NextResponse.json(
                { error: "Could not send the invitation email. Ask the workspace administrator to check the email configuration, then try again." },
                { status: 502 }
            );
        }

        return NextResponse.json({ message: "Invitation sent", invitation });
    } catch (err: unknown) {
        console.error(err);

        return NextResponse.json({ error: "Could not create the invitation. Please try again." }, { status: 500 });
    }
}
