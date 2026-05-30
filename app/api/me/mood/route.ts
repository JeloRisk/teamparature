/*
 * GET /api/me/mood
 *
 * Personal mood analytics dashboard
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import connectDB from "@/lib/mongodb"
import { Mood } from "@/models/Mood"
import User from "@/models/User";
export async function GET() {
    await connectDB()

    const session = await getServerSession()
// const session = await getServerSession()

console.log("SESSION:", session)
    if (!session?.user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }

const user = await User.findOne({
    email: session.user.email,
}).select("_id")

if (!user) {
    return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
    )
}

const moods = await Mood.find({
    user: user._id,
})
    .sort({ date: 1 })
    .lean()

    // ---------------------------------------------------
    // EMPTY STATE
    // ---------------------------------------------------

    if (!moods.length) {
        return NextResponse.json({
            overview: {
                emotionalScore: 0,
                avgRank: 0,
                streak: 0,
                stability: 0,
                dominantMood: null,
            },

            weeklyStats: {
                totalCheckIns: 0,
                positiveDays: 0,
                negativeDays: 0,
                neutralDays: 0,
                bestDay: null,
                averageThisWeek: 0,
            },

            moodBreakdown: {
                happy: 0,
                excited: 0,
                neutral: 0,
                sad: 0,
                stressed: 0,
            },

            weeklyTrend: [],
            recentCheckIns: [],
            heatmap: [],
        })
    }

    // ---------------------------------------------------
    // MOOD COUNTS
    // ---------------------------------------------------

    const moodBreakdown = {
        happy: 0,
        excited: 0,
        neutral: 0,
        sad: 0,
        stressed: 0,
    }

    for (const mood of moods) {
        if (moodBreakdown[mood.mood] !== undefined) {
            moodBreakdown[mood.mood]++
        }
    }

    // ---------------------------------------------------
    // AVERAGE RANK
    // ---------------------------------------------------

    const totalLogs = moods.length

    const avgRank =
        moods.reduce(
            (sum, mood) => sum + (Number(mood.rank) || 0),
            0
        ) / totalLogs

    // ---------------------------------------------------
    // EMOTIONAL SCORE
    // ---------------------------------------------------

    const emotionalScore = Math.round((avgRank / 5) * 100)

    // ---------------------------------------------------
    // DOMINANT MOOD
    // ---------------------------------------------------

    const dominantMood = Object.entries(
        moodBreakdown
    ).sort((a, b) => b[1] - a[1])[0][0]

    // ---------------------------------------------------
    // STREAK
    // ---------------------------------------------------

    let streak = 0

    const uniqueDates = [
        ...new Set(
            moods.map((m) =>
                new Date(m.date).toDateString()
            )
        ),
    ].reverse()

    let currentDate = new Date()

    currentDate.setHours(0, 0, 0, 0)

    for (const dateStr of uniqueDates) {
        const compareDate = new Date(dateStr)

        compareDate.setHours(0, 0, 0, 0)

        if (
            compareDate.toDateString() ===
            currentDate.toDateString()
        ) {
            streak++
            currentDate.setDate(
                currentDate.getDate() - 1
            )
        } else {
            break
        }
    }

    // ---------------------------------------------------
    // STABILITY SCORE
    // ---------------------------------------------------

    const recentRanks = moods
        .slice(-14)
        .map((m) => Number(m.rank) || 0)

    let stability = 100

    if (recentRanks.length > 1) {
        const mean =
            recentRanks.reduce((a, b) => a + b, 0) /
            recentRanks.length

        const variance =
            recentRanks.reduce(
                (sum, value) =>
                    sum + Math.pow(value - mean, 2),
                0
            ) / recentRanks.length

        const stdDev = Math.sqrt(variance)

        stability = Math.max(
            0,
            Math.round(100 - stdDev * 20)
        )
    }

    // ---------------------------------------------------
    // WEEKLY STATS
    // ---------------------------------------------------

    const last7Days = moods.filter((m) => {
        const moodDate = new Date(m.date)
        const now = new Date()

        const diff =
            now.getTime() - moodDate.getTime()

        return diff <= 7 * 24 * 60 * 60 * 1000
    })

    const positiveDays =
        last7Days.filter((m) =>
            ["happy", "excited"].includes(m.mood)
        ).length

    const negativeDays =
        last7Days.filter((m) =>
            ["sad", "stressed"].includes(m.mood)
        ).length

    const neutralDays =
        last7Days.filter(
            (m) => m.mood === "neutral"
        ).length

    const averageThisWeek =
        last7Days.length > 0
            ? last7Days.reduce(
                  (sum, mood) =>
                      sum + (Number(mood.rank) || 0),
                  0
              ) / last7Days.length
            : 0

    // ---------------------------------------------------
    // BEST DAY
    // ---------------------------------------------------

    const weekdayScores: Record<
        string,
        number[]
    > = {}

    for (const mood of last7Days) {
        const day = new Date(
            mood.date
        ).toLocaleDateString("en-US", {
            weekday: "long",
        })

        if (!weekdayScores[day]) {
            weekdayScores[day] = []
        }

        weekdayScores[day].push(
            Number(mood.rank) || 0
        )
    }

    let bestDay: string | null = null
    let bestAvg = 0

    Object.entries(weekdayScores).forEach(
        ([day, scores]) => {
            const avg =
                scores.reduce((a, b) => a + b, 0) /
                scores.length

            if (avg > bestAvg) {
                bestAvg = avg
                bestDay = day
            }
        }
    )

    // ---------------------------------------------------
    // WEEKLY TREND
    // ---------------------------------------------------

    const weeklyTrend = []

    for (let i = 6; i >= 0; i--) {
        const d = new Date()

        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() - i)

        const found = moods.find(
            (m) =>
                new Date(m.date).toDateString() ===
                d.toDateString()
        )

        weeklyTrend.push({
            day: d.toLocaleDateString("en-US", {
                weekday: "short",
            }),
            mood: found?.mood || null,
            rank: found?.rank || 0,
        })
    }

    // ---------------------------------------------------
    // RECENT CHECK INS
    // ---------------------------------------------------

    const recentCheckIns = moods
        .slice(-5)
        .reverse()
        .map((m) => ({
            mood: m.mood,
            rank: m.rank,
            note: m.note || "",
            date: m.date,
        }))

    // ---------------------------------------------------
    // HEATMAP
    // ---------------------------------------------------

    const heatmap = moods.map((m) => ({
        date: m.date,
        mood: m.mood,
        rank: m.rank,
    }))

    // ---------------------------------------------------
    // RESPONSE
    // ---------------------------------------------------

    return NextResponse.json({
        overview: {
            emotionalScore,
            avgRank: Number(avgRank.toFixed(2)),
            streak,
            stability,
            dominantMood,
        },

        weeklyStats: {
            totalCheckIns: last7Days.length,
            positiveDays,
            negativeDays,
            neutralDays,
            bestDay,
            averageThisWeek: Number(
                averageThisWeek.toFixed(2)
            ),
        },

        moodBreakdown,

        weeklyTrend,

        recentCheckIns,

        heatmap,
    })
}