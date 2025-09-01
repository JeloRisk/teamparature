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
import { Mood } from "@/models/Mood"

export async function GET(
    req: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    await connectDB()
    const session = await getServerSession()
    if (!session?.user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = await context.params
    const moods = await Mood.find({ organization: orgId }).lean()

    if (!moods.length) {
        return NextResponse.json({
            orgTemperature: 0,
            avgRank: 0,
            totalLogs: 0,
            volatility: 0,
            positive: 0,
            negative: 0,
            posPct: 0,
            negPct: 0,
            participants: 0,
            moodCounts: { happy: 0, excited: 0, neutral: 0, sad: 0, stressed: 0 },
            moodMetrics: {},
            detailedSeries: [],
        })
    }

    // --- Global metrics ---
    const totalLogs = moods.length
    const avgRank =
        moods.reduce((sum, m) => sum + (Number(m.rank) || 0), 0) / totalLogs

    const moodTypes = ["happy", "excited", "neutral", "sad", "stressed"]

    // Count moods individually + gather per mood ranks/users
    const moodCounts: Record<string, number> = {}
    const moodRanks: Record<string, number[]> = {}
    const moodUsers: Record<string, Set<string>> = {}

    moodTypes.forEach((mt) => {
        moodCounts[mt] = 0
        moodRanks[mt] = []
        moodUsers[mt] = new Set()
    })

    for (const m of moods) {
        if (moodCounts[m.mood] !== undefined) {
            moodCounts[m.mood]++
            moodRanks[m.mood].push(Number(m.rank) || 0)
            moodUsers[m.mood].add(String(m.user))
        }
    }

    // Build per-mood measurement of tendency
    const moodMetrics: Record<
        string,
        { count: number; percentage: number; avgRank: number; uniqueUsers: number }
    > = {}

    moodTypes.forEach((mt) => {
        const count = moodCounts[mt]
        const avg =
            count > 0
                ? moodRanks[mt].reduce((a, b) => a + b, 0) / moodRanks[mt].length
                : 0
        moodMetrics[mt] = {
            count,
            percentage: totalLogs ? Math.round((count / totalLogs) * 100) : 0,
            avgRank: Number(avg.toFixed(2)),
            uniqueUsers: moodUsers[mt].size,
        }
    })

    const positive = moodCounts.happy + moodCounts.excited
    const negative = moodCounts.sad + moodCounts.stressed
    const posPct = totalLogs ? Math.round((positive / totalLogs) * 100) : 0
    const negPct = totalLogs ? Math.round((negative / totalLogs) * 100) : 0
    const participants = new Set(moods.map((m) => String(m.user))).size

    // --- Daily analytics (14 days) ---
    const days = 14
    const detailedSeries: {
        day: string
        avg: number
        positive: number
        negative: number
        total: number
        happy: number
        excited: number
        neutral: number
        sad: number
        stressed: number
    }[] = []

    const volatilitySeries: number[] = []

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() - i)

        const dayLogs = moods.filter(
            (m) => new Date(m.date).toDateString() === d.toDateString()
        )

        const avg =
            dayLogs.length > 0
                ? dayLogs.reduce((s, m) => s + (Number(m.rank) || 0), 0) /
                dayLogs.length
                : 0

        const dayCounts: Record<string, number> = {
            happy: 0,
            excited: 0,
            neutral: 0,
            sad: 0,
            stressed: 0,
        }

        for (const m of dayLogs) {
            if (dayCounts[m.mood] !== undefined) {
                dayCounts[m.mood]++
            }
        }

        const dayLabel = d.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
        })

        detailedSeries.push({
            day: dayLabel,
            avg: Number(avg.toFixed(2)),
            positive: dayCounts.happy + dayCounts.excited,
            negative: dayCounts.sad + dayCounts.stressed,
            total: dayLogs.length,
            ...dayCounts,
            happy: 0,
            excited: 0,
            neutral: 0,
            sad: 0,
            stressed: 0
        })

        if (dayLogs.length > 0) volatilitySeries.push(avg)
    }

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
        posPct,
        negPct,
        participants,
        moodCounts,
        moodMetrics,
        detailedSeries,
    })
}
