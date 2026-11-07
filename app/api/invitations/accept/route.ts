import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { Membership } from "@/models/Membership";
import User from "@/models/User";

export async function POST(req: Request) {
    await connectDB();
    const { token } = await req.json();

    // Get logged-in user from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find invitation by token
    const invitation = await Invitation.findOne({ token });
    if (!invitation) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });

    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
        return NextResponse.json({ error: "Sign in with the invited email address" }, { status: 403 });
    }
    if (invitation.status === "accepted") {
        return NextResponse.json({ message: "Invitation already accepted" });
    }

    // Check if token is expired (createdAt + 24h)
    const expiresAt = invitation.expiresAt ?? new Date(invitation.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (invitation.status === "expired" || new Date() >= expiresAt) {
        return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
    }

    // Add user to organization
    await Membership.create({
        user: user._id,
        organization: invitation.organization,
        role: invitation.role,
        isCreator: false,
    });

    // Optionally mark invitation as accepted
    invitation.status = "accepted";
    await invitation.save();

    return NextResponse.json({ message: "You have joined the organization!" });
}
