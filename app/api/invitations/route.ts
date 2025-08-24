import { NextResponse } from "next/server";
import crypto from "crypto";
import connectD from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { sendOrgInvitationEmail } from "@/lib/orgInvitationMailer";

export async function POST(req: Request) {
    await connectD();
    const { orgId, email, role, inviterName, invitedBy } = await req.json();

    if (!orgId || !email || !invitedBy || !inviterName) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invitation = await Invitation.create({
        organization: orgId,
        email,
        role: role || "member",
        invitedBy,
        token,
    });

    await sendOrgInvitationEmail({
        inviterName,
        inviteeEmail: email,
        orgName: "Your Organization Name",
        token,
    });

    return NextResponse.json({ message: "Invitation sent", invitation });
}
