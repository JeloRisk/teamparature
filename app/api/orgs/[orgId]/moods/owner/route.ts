import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import { Mood } from "@/models/Mood";
import { Organization } from "@/models/Organization";
import User from "@/models/User";

// reuse DB connection
await connectDB();

export async function POST(req: Request, { params }: { params: { orgId: string } }) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = params;
        const { mood, rank, note, userName, userEmail } = await req.json();

        // fetch user + org in parallel
        const [user, org] = await Promise.all([
            User.findOne({ email: session.user.email }).select("_id name email"),
            Organization.findById(orgId).select("_id"),
        ]);

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

        // "already tracked today"
        // const today = new Date();
        // today.setUTCHours(0, 0, 0, 0);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());


        const exists = await Mood.exists({
            user: user._id,
            organization: orgId,
            date: { $gte: today },
        });

        if (exists) {
            return NextResponse.json({ error: "Already tracked today" }, { status: 400 });
        }

        const newMood = await Mood.create({
            user: user._id,
            organization: orgId,
            userSnapshot: {
                name: userName ?? user.name ?? session.user.name,
                email: userEmail ?? user.email ?? session.user.email,
            },
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

export async function GET(req: Request, { params }: { params: { orgId: string } }) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = params;

        // fetch user + org in parallel
        const [user, org] = await Promise.all([
            User.findOne({ email: session.user.email }).select("_id"),
            Organization.findById(orgId).select("_id"),
        ]);

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

        // limit fields returned (faster)
        const moods = await Mood.find({ organization: orgId, user: user._id })
            .select("mood rank note date userSnapshot")
            .lean();

        return NextResponse.json(moods);
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
