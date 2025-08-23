import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { Team } from "@/models/Team";
import { Membership } from "@/models/Membership";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req: Request) {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const org = await Organization.create({
        name: body.name,
        description: body.description || "",
        inviteCode,
        createdBy: session.user.id,
    });

    const team = await Team.create({
        organization: org._id,
        name: `${org.name} Team`,
        description: `Default team for ${org.name}`,
        createdBy: session.user.id,
    });
    org.team = team._id;
    await org.save();

    const membership = await Membership.create({
        user: session.user.id,
        organization: org._id,
        team: team._id,
        role: "owner",
        isActive: true,
    });

    await User.findByIdAndUpdate(session.user.id, { onboarded: true });

    return NextResponse.json({
        success: true,
        message: "Organization created successfully",
        organization: org,
        team,
        membership,
    });
}
