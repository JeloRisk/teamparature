import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import { Mood } from "@/models/Mood";
import { Organization } from "@/models/Organization";
import User from "@/models/User";

export async function POST(req: Request, { params }: { params: { orgId: string } }) {
    try {
        await connectDB();

        const session = await getServerSession();
        if (!session?.user?.email) {
            console.log("Unauthorized access");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = params;
        const body = await req.json();
        console.log("Request Body:", body);

        const { mood, rank, note, userName, userEmail } = body;

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            console.log("User not found");
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const org = await Organization.findById(orgId);
        if (!org) {
            console.log("Organization not found");
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const today = new Date().toISOString().slice(0, 10);
        const exists = await Mood.findOne({
            user: user._id,
            organization: orgId,
            date: {
                $gte: new Date(today),
                $lte: new Date(today + "T23:59:59.999Z"),
            },
        });

        if (exists) {
            console.log("Already tracked today");
            return NextResponse.json({ error: "Already tracked today" }, { status: 400 });
        }

        const newMood = await Mood.create({
            user: user._id, // found id
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

        console.log("Mood Created:", newMood);

        return NextResponse.json(newMood);
    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}



export async function GET(
    req: Request,
    { params }: { params: { orgId: string } }
) {
    try {
        await connectDB();

        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = params;

        const org = await Organization.findById(orgId);
        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const moods = await Mood.find({
            organization: orgId,
            user: user._id,
        }).lean();

        return NextResponse.json(moods);
    } catch (error) {
        console.error("GET Mood by Session User Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
