import type { HeatmapCell, HeatmapMood } from "@/lib/mood-heatmap"
import { positiveShare } from "@/lib/mood-reporting"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import { Types } from "mongoose"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"
import { getWorkspaceTimezone, workspaceDayBoundaries } from "@/lib/workspace-time"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import { Mood } from "@/models/Mood"

export async function GET(
    req: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = await context.params
    if (!Types.ObjectId.isValid(orgId))
        return NextResponse.json({ error: "Invalid organization" }, { status: 400 })

    await connectDB()
    const access = await requirePermission(session.user.id, orgId, "view_analytics")
    if (access !== true) return access

    const organization = new Types.ObjectId(orgId)
    const timezone = await getWorkspaceTimezone(orgId)
    const boundaries = workspaceDayBoundaries(timezone, 13)
    const year = Number(formatInTimeZone(new Date(), timezone, "yyyy"))
    const [[period], daily, heatmap] = await Promise.all([
        Mood.aggregate([
            { $match: { organization, date: { $gte: boundaries[0], $lt: boundaries[14] } } },
            { $facet: {
                moods: [
                    { $group: {
                        _id: "$mood",
                        count: { $sum: 1 },
                        rankSum: { $sum: "$rank" },
                        users: { $addToSet: "$user" },
                    } },
                    { $project: { count: 1, rankSum: 1, uniqueUsers: { $size: "$users" } } },
                ],
                participants: [{ $group: { _id: "$user" } }, { $count: "count" }],
            } },
        ]),
        Mood.aggregate([
            { $match: { organization, date: { $gte: boundaries[0], $lt: boundaries[14] } } },
            { $bucket: {
                groupBy: "$date",
                boundaries,
                output: {
                    total: { $sum: 1 },
                    avg: { $avg: "$rank" },
                    happy: { $sum: { $cond: [{ $eq: ["$mood", "happy"] }, 1, 0] } },
                    excited: { $sum: { $cond: [{ $eq: ["$mood", "excited"] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ["$mood", "neutral"] }, 1, 0] } },
                    sad: { $sum: { $cond: [{ $eq: ["$mood", "sad"] }, 1, 0] } },
                    stressed: { $sum: { $cond: [{ $eq: ["$mood", "stressed"] }, 1, 0] } },
                },
            } },
        ]),
        Mood.aggregate([
            { $match: { organization, date: {
                $gte: fromZonedTime(`${year}-01-01T00:00:00`, timezone),
                $lt: fromZonedTime(`${year + 1}-01-01T00:00:00`, timezone),
            } } },
            { $project: {
                mood: 1,
                parts: { $dateToParts: { date: "$date", timezone } },
            } },
            { $group: {
                _id: {
                    month: "$parts.month",
                    week: { $ceil: { $divide: ["$parts.day", 7] } },
                    mood: "$mood",
                },
                count: { $sum: 1 },
            } },
            { $group: {
                _id: { month: "$_id.month", week: "$_id.week" },
                total: { $sum: "$count" },
                counts: { $push: { k: "$_id.mood", v: "$count" } },
            } },
            { $project: { _id: 0, month: "$_id.month", week: "$_id.week", total: 1, counts: { $arrayToObject: "$counts" } } },

        ]),
    ])

    const moodTypes = ["happy", "excited", "neutral", "sad", "stressed"]
    const totalLogs = period.moods.reduce((sum: number, row: { count: number }) => sum + row.count, 0)
    const rankSum = period.moods.reduce((sum: number, row: { rankSum: number }) => sum + row.rankSum, 0)
    const avgRank = totalLogs ? rankSum / totalLogs : null
    const percentage = (count: number) => totalLogs ? Math.round(count * 100 / totalLogs) : 0
    const moodMetrics = Object.fromEntries(moodTypes.map(mood => {
        const row = period.moods.find((row: { _id: string }) => row._id === mood)
        return [mood, {
            count: row?.count ?? 0,
            percentage: percentage(row?.count ?? 0),
            avgRank: row ? Number((row.rankSum / row.count).toFixed(2)) : 0,
            uniqueUsers: row?.uniqueUsers ?? 0,
        }]
    }))
    const moodCounts = Object.fromEntries(moodTypes.map(mood => [mood, moodMetrics[mood].count]))
    const positive = moodCounts.happy + moodCounts.excited
    const negative = moodCounts.sad + moodCounts.stressed
    const participants = period.participants[0]?.count ?? 0
    const detailedSeries = boundaries.slice(0, 14).map(date => {
        const row = daily.find(row => row._id.getTime() === date.getTime())
        const happy = row?.happy ?? 0
        const excited = row?.excited ?? 0
        const sad = row?.sad ?? 0
        const stressed = row?.stressed ?? 0
        return {
            day: date.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: timezone }),
            avg: row ? Number(row.avg.toFixed(2)) : null,
            total: row?.total ?? 0,
            happy, excited, sad, stressed,
            neutral: row?.neutral ?? 0,
            positive: happy + excited,
            negative: sad + stressed,
        }
    })
    const volatilitySeries = daily.map(row => Number(row.avg ?? 0))

    // --- Volatility ---
    let volatility: number | null = null
    if (volatilitySeries.length > 1) {
        const mean =
            volatilitySeries.reduce((a, b) => a + b, 0) / volatilitySeries.length
        const variance =
            volatilitySeries.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
            (volatilitySeries.length - 1)
        volatility = Math.sqrt(variance)
    }

    const orgTemperature = positiveShare(moodCounts.happy, moodCounts.excited, totalLogs)

    return NextResponse.json({
        timezone,
        periodStart: boundaries[0].toISOString(),
        periodEnd: boundaries[14].toISOString(),
        orgTemperature,
        avgRank: avgRank === null ? null : Number(avgRank.toFixed(2)),
        totalLogs,
        volatility: volatility === null ? null : Number(volatility.toFixed(2)),
        positive,
        negative,
        posPct: percentage(positive),
        negPct: percentage(negative),
        participants,
        moodCounts,
        moodMetrics,
        detailedSeries,
        heatmap: heatmap as (HeatmapCell & { counts: Partial<Record<HeatmapMood, number>> })[],
        year,
    })
}
