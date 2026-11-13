import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { requirePermission } from "@/lib/rbac"
import { getWorkspaceTimezone } from "@/lib/workspace-time"
import { fromZonedTime, formatInTimeZone } from "date-fns-tz"
import { Mood } from "@/models/Mood"
import type { HeatmapMood } from "@/lib/mood-heatmap"

function isDateKey(value: string | null): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export async function GET(req: Request, context: { params: Promise<{ orgId: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = await context.params
    if (!Types.ObjectId.isValid(orgId)) return NextResponse.json({ error: "Invalid organization" }, { status: 400 })

    const date = new URL(req.url).searchParams.get("date")
    if (!isDateKey(date)) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 })

    await connectDB()
    const access = await requirePermission(session.user.id, orgId, "view_analytics")
    if (access !== true) return access

    const timezone = await getWorkspaceTimezone(orgId)
    const today = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd")
    if (date > today) return NextResponse.json({ error: "That date has not occurred yet." }, { status: 400 })

    const nextDay = new Date(`${date}T00:00:00Z`)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    const start = fromZonedTime(`${date}T00:00:00`, timezone)
    const end = fromZonedTime(`${nextDay.toISOString().slice(0, 10)}T00:00:00`, timezone)
    const organization = new Types.ObjectId(orgId)
    const rows = await Mood.find({ organization, date: { $gte: start, $lt: end } })
        .select("mood date")
        .sort({ date: -1, _id: -1 })
        .lean<{ _id: Types.ObjectId; mood: HeatmapMood; date: Date }[]>()

    return NextResponse.json({
        checkIns: rows.map(row => ({
            id: String(row._id),
            mood: row.mood,
            date: row.date.toISOString(),
        })),
    })
}
