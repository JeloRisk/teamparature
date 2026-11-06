/*
 * GET /api/orgs/:orgId/moods/analytics
 * 
 * Returns aggregated mood analytics for a given organization.
 * 
 * Response JSON object:
 * {
 *   orgTemperature: number, // Gauge value 0-100 based on average mood rank
 *   avgRank: number,        // Average mood rank across all logs (0-5)
 *   totalLogs: number,      // Total number of mood logs
 *   volatility: number,     // Standard deviation of daily average mood rank over last 14 days
 *   positive: number,       // Count of positive moods ("happy", "excited")
 *   negative: number,       // Count of negative moods ("sad", "stressed")
 *   posPct: number,         // Number of positive mood logs (or percentage if modified)
 *   negPct: number,         // Number of negative mood logs (or percentage if modified)
 *   participants: number,   // Unique participants who submitted moods
 *   series: Array<{day: string, logs: number}> // Daily log counts for last 14 days
 * }
 */
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import { Types } from "mongoose"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const boundaries = Array.from({ length: 15 }, (_, i) => {
        const date = new Date(today)
        date.setDate(today.getDate() + i - 13)
        return date
    })

    const year = today.getFullYear()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const [[allTime], daily, heatmap] = await Promise.all([
        Mood.aggregate([
            { $match: { organization } },
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
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1),
            } } },
            { $sort: { date: 1 } },
            { $project: {
                mood: 1,
                parts: { $dateToParts: { date: "$date", timezone } },
            } },
            { $group: {
                _id: {
                    month: "$parts.month",
                    week: { $ceil: { $divide: ["$parts.day", 7] } },
                },
                mood: { $first: "$mood" },
                day: { $first: "$parts.day" },
            } },
            { $project: { _id: 0, mood: 1, day: 1, month: "$_id.month" } },
        ]),
    ])

    const moodTypes = ["happy", "excited", "neutral", "sad", "stressed"]
    const totalLogs = allTime.moods.reduce((sum: number, row: { count: number }) => sum + row.count, 0)
    const rankSum = allTime.moods.reduce((sum: number, row: { rankSum: number }) => sum + row.rankSum, 0)
    const avgRank = totalLogs ? rankSum / totalLogs : 0
    const percentage = (count: number) => totalLogs ? Math.round(count * 100 / totalLogs) : 0
    const moodMetrics = Object.fromEntries(moodTypes.map(mood => {
        const row = allTime.moods.find((row: { _id: string }) => row._id === mood)
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
    const participants = allTime.participants[0]?.count ?? 0
    const detailedSeries = boundaries.slice(0, 14).map(date => {
        const row = daily.find(row => row._id.getTime() === date.getTime())
        const happy = row?.happy ?? 0
        const excited = row?.excited ?? 0
        const sad = row?.sad ?? 0
        const stressed = row?.stressed ?? 0
        return {
            day: date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
            avg: Number((row?.avg ?? 0).toFixed(2)),
            total: row?.total ?? 0,
            happy, excited, sad, stressed,
            neutral: row?.neutral ?? 0,
            positive: happy + excited,
            negative: sad + stressed,
        }
    })
    const volatilitySeries = daily.map(row => Number(row.avg ?? 0))

    // --- Volatility ---
    let volatility = 0
    if (volatilitySeries.length > 1) {
        const mean =
            volatilitySeries.reduce((a, b) => a + b, 0) / volatilitySeries.length
        const variance =
            volatilitySeries.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
            (volatilitySeries.length - 1)
        volatility = Math.sqrt(variance)
    }

    const orgTemperature = Math.round((avgRank / 5) * 100)

    return NextResponse.json({
        orgTemperature,
        avgRank: Number(avgRank.toFixed(2)),
        totalLogs,
        volatility: Number(volatility.toFixed(2)),
        positive,
        negative,
        posPct: percentage(positive),
        negPct: percentage(negative),
        participants,
        moodCounts,
        moodMetrics,
        detailedSeries,
        heatmap,
        year,
    })
}
