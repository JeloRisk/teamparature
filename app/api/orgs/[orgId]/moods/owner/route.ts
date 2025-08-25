import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import { Mood } from "@/models/Mood";
import { Organization } from "@/models/Organization";

export async function POST(req: Request, { params }: { params: { orgId: string } }) {
    await connectDB();

    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orgId } = params;

    // check if user is the owner
    const org = await Organization.findById(orgId);
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (org.createdBy.toString() !== session.user.id)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { mood, rank, note, userId, userName, userEmail } = await req.json();

    // check if mood already exists today for this user
    const today = new Date().toISOString().slice(0, 10);
    const exists = await Mood.findOne({
        user: userId,
        organization: orgId,
        date: { $gte: new Date(today), $lte: new Date(today + "T23:59:59.999Z") },
    });

    if (exists) {
        return NextResponse.json({ error: "Already tracked today" }, { status: 400 });
    }

    const newMood = await Mood.create({
        user: userId,
        organization: orgId,
        userSnapshot: { name: userName, email: userEmail },
        mood,
        rank,
        note,
        date: new Date(),
    });

    return NextResponse.json(newMood);
}

export async function GET(req: Request, { params }: { params: { orgId: string } }) {
    await connectDB();

    const { orgId } = params;
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(orgId);
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (org.createdBy.toString() !== session.user.id)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const moods = await Mood.find({ organization: orgId }).lean();
    return NextResponse.json(moods);
}
