import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { Membership } from "@/models/Membership"
import { Mood } from "@/models/Mood"
import { POST as submitMood } from "./owner/route"

export async function POST(req: Request, context: { params: Promise<{ orgId: string }> }) {
    return submitMood(req, context)
}

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!Types.ObjectId.isValid(orgId)) return NextResponse.json({ error: "Invalid organization" }, { status: 400 })

    await connectDB()
    const organization = new Types.ObjectId(orgId)
    const user = session.user.id
    if (!(await Membership.exists({ organization, user, isActive: true }))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Array.from({ length: 8 }, (_, i) => {
        const date = new Date(today)
        date.setDate(today.getDate() + i - 6)
        return date
    })

    const [checkedIn, counts] = await Promise.all([
        Mood.exists({ organization, user, date: { $gte: today, $lt: days[7] } }),
        Mood.aggregate([
            { $match: { organization, date: { $gte: days[0], $lt: days[7] } } },
            { $bucket: {
                groupBy: "$date",
                boundaries: days,
                output: {
                    happy: { $sum: { $cond: [{ $eq: ["$mood", "happy"] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ["$mood", "neutral"] }, 1, 0] } },
                    sad: { $sum: { $cond: [{ $eq: ["$mood", "sad"] }, 1, 0] } },
                    stressed: { $sum: { $cond: [{ $eq: ["$mood", "stressed"] }, 1, 0] } },
                    excited: { $sum: { $cond: [{ $eq: ["$mood", "excited"] }, 1, 0] } },
                },
            } },
        ]),
    ])

    const trend = days.slice(0, 7).map((date) => {
        const count = counts.find((entry) => entry._id.getTime() === date.getTime())
        return {
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            happy: count?.happy ?? 0,
            neutral: count?.neutral ?? 0,
            sad: count?.sad ?? 0,
            stressed: count?.stressed ?? 0,
            excited: count?.excited ?? 0,
        }
    })

    return NextResponse.json({ checkedInToday: Boolean(checkedIn), trend })
}
