import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    await connectDB();

    const body = await req.json();
const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const org = await Organization.create({
        name: body.name,
        inviteCode,
        createdBy: session.user.id, 
    });

    await User.findByIdAndUpdate(session.user.id, {
        $push: { orgs: { orgId: org._id, role: "owner" } },
    });

    return NextResponse.json(org);
}
