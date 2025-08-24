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

export async function POST(req: Request, context: { params: { orgId: string } }) {
    await connectDB();
    const { orgId } = context.params;
    const { email, role } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const inviter = await User.findById(session.user.id);
    if (!inviter) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const org = await Organization.findById(orgId);
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // ✅ DRY RBAC check
    const membershipCheck = await requirePermission(session.user.id, orgId, "invite_member");
    if (membershipCheck instanceof NextResponse) return membershipCheck;

    // check if user already exists
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

    // check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
        organization: orgId,
        email,
        status: "pending",
        expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
        return NextResponse.json(
            { error: "An active invitation already exists for this user" },
            { status: 400 }
        );
    }

    // create token & save invitation
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

    // send email
    await sendOrgInvitationEmail({
        inviterName: inviter.firstName || inviter.email,
        inviteeEmail: email,
        orgName: org.name,
        token,
    });

    return NextResponse.json({ message: "Invitation sent", invitation });
}
