// app/api/orgs/[orgId]/moods/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import { Mood } from "@/models/Mood"

export async function POST(req: Request, { params }: { params: { orgId: string } }) {
    await connectDB()
    const session = await getServerSession()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { mood, rank, note } = await req.json()
    const userId = session.user.id
    const orgId = params.orgId

    // check if mood already exists today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingMood = await Mood.findOne({
        user: userId,
        organization: orgId,
        date: { $gte: today },
    })

    if (existingMood) {
        return NextResponse.json({ error: "Mood already submitted today" }, { status: 400 })
    }

    const newMood = await Mood.create({
        user: userId,
        organization: orgId,
        mood,
        rank,
        note,
        userSnapshot: {
            name: session.user.name,
            email: session.user.email,
        },
    })

    return NextResponse.json(newMood)
}

export async function GET(req: Request, { params }: { params: { orgId: string } }) {
    await connectDB()
    const orgId = params.orgId

    const moods = await Mood.find({ organization: orgId }).lean()
    return NextResponse.json(moods)
}
