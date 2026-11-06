import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import crypto from "crypto";
import connectD from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { sendOrgInvitationEmail } from "@/lib/orgInvitationMailer";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orgId, email, role } = await req.json();

    if (typeof orgId !== "string" || !Types.ObjectId.isValid(orgId) || !email) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectD();
    const access = await requirePermission(session.user.id, orgId, "invite_member");
    if (access !== true) return access;

    const token = crypto.randomBytes(32).toString("hex");

    const invitation = await Invitation.create({
        organization: orgId,
        email,
        role: role || "member",
        invitedBy: session.user.id,
        token,
    });

    await sendOrgInvitationEmail({
        inviterName: session.user.name ?? session.user.email ?? "Workspace owner",
        inviteeEmail: email,
        orgName: "Your Organization Name",
        token,
    });

    return NextResponse.json({ message: "Invitation sent", invitation });
}
