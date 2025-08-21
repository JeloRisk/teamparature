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
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await req.json();

    const org = await Organization.findOne({ inviteCode });
    if (!org) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Ensure org has a team (1-to-1)
    let team = await Team.findOne({ organization: org._id });
    if (!team) {
        team = await Team.create({
            organization: org._id,
            name: `${org.name} Team`,
            description: `Default team for ${org.name}`,
            createdBy: org.createdBy,
        });
        org.team = team._id;
        await org.save();
    }

    // Check if user is already a member
    let membership = await Membership.findOne({
        user: session.user.id,
        organization: org._id,
    });

    if (membership) {
        if (membership.isActive) {
            // already an active member
            return NextResponse.json(
                { error: "You are already a member of this organization" },
                { status: 400 }
            );
        } else {
            membership.isActive = true;
            await membership.save();

            return NextResponse.json({
                success: true,
                message: "Membership reactivated",
                organization: org,
                team,
                membership,
            });
        }
    }

    // Create a new membership
    membership = await Membership.create({
        user: session.user.id,
        organization: org._id,
        team: team._id,
        role: "member",
        isActive: true,
    });
    await User.findByIdAndUpdate(session.user.id, { onboarded: true });


    return NextResponse.json({
        success: true,
        message: "Joined organization successfully",
        organization: org,
        team,
        membership,
    });
}