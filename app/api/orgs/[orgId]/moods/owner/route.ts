import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import { Mood } from "@/models/Mood";
import { Membership } from "@/models/Membership";
import { authOptions } from "@/lib/auth";


export async function POST(
    req: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await context.params;
        if (!Types.ObjectId.isValid(orgId)) return NextResponse.json({ error: "Invalid organization" }, { status: 400 });
        const { mood, rank, note } = await req.json();
        const user = session.user.id;
        await connectDB();
        if (!(await Membership.exists({ user, organization: orgId, isActive: true }))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());


        const exists = await Mood.exists({
            user,
            organization: orgId,
            date: { $gte: today },
        });

        if (exists) {
            return NextResponse.json({ error: "Already tracked today" }, { status: 409 });
        }

        const newMood = await Mood.create({
            user,
            organization: orgId,
            mood,
            rank,
            note,
            date: new Date(),
        });

        return NextResponse.json(newMood);
    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: Request,
    context: { params: Promise<{ orgId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await context.params;
        if (!Types.ObjectId.isValid(orgId)) return NextResponse.json({ error: "Invalid organization" }, { status: 400 });

        const user = session.user.id;
        await connectDB();
        if (!(await Membership.exists({ user, organization: orgId, isActive: true }))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // limit fields returned (faster)
        const moods = await Mood.find({ organization: orgId, user })
            .select("mood rank note date")
            .lean();

        return NextResponse.json(moods);
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
