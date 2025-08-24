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

export async function POST(req: Request, context: { params: { orgId: string } }) {
    await connectDB();
    const { orgId } = context.params;
    const body = await req.json();
    const { email, role } = body;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inviter = await User.findOne({ email: session.user.email });
    if (!inviter) {
        return NextResponse.json({ error: "Inviter not found" }, { status: 404 });
    }

    // fetch organization
    const org = await Organization.findById(orgId);
    if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        // check if already member of org
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

    // check if there's already a pending invitation for this email
    const existingInvitation = await Invitation.findOne({
        organization: orgId,
        email,
        status: "pending",
        expiresAt: { $gt: new Date() }, // still valid
    });

    if (existingInvitation) {
        return NextResponse.json(
            { error: "An active invitation already exists for this user" },
            { status: 400 }
        );
    }

    // create unique token
    const token = crypto.randomBytes(32).toString("hex");

    // save invitation in DB (expires in 1 day)
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
