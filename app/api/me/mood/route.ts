/*
 * GET /api/me/mood
 *
 * Personal mood analytics dashboard - Isolated to Current Week (Mon-Sun)
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import connectDB from "@/lib/mongodb"
import { Mood } from "@/models/Mood"
import User from "@/models/User"

export async function GET() {
    await connectDB()

    const session = await getServerSession()

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
    // EMPTY STATE DUMMY
    // ---------------------------------------------------
    if (!moods.length) {
        return NextResponse.json({
            overview: { emotionalScore: 0, avgRank: 0, streak: 0, stability: 0, dominantMood: null },
            weeklyStats: { totalCheckIns: 0, positiveDays: 0, negativeDays: 0, neutralDays: 0, bestDay: null, averageThisWeek: 0 },
            moodBreakdown: { happy: 0, excited: 0, neutral: 0, sad: 0, stressed: 0 },
            weeklyTrend: [],
            recentCheckIns: [],
            heatmap: [],
        })
    }

    // ---------------------------------------------------
    // GENERAL METRICS PROCESSING
    // ---------------------------------------------------
    const moodBreakdown = { happy: 0, excited: 0, neutral: 0, sad: 0, stressed: 0 }
    for (const mood of moods) {
        if (moodBreakdown[mood.mood] !== undefined) {
            moodBreakdown[mood.mood]++
        }
    }

    const totalLogs = moods.length
    const avgRank = moods.reduce((sum, mood) => sum + (Number(mood.rank) || 0), 0) / totalLogs
    const emotionalScore = Math.round((avgRank / 5) * 100)
    const dominantMood = Object.entries(moodBreakdown).sort((a, b) => b[1] - a[1])[0][0]

    // STREAK
    let streak = 0
    const uniqueDates = [...new Set(moods.map((m) => new Date(m.date).toDateString()))].reverse()
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const dateStr of uniqueDates) {
        const compareDate = new Date(dateStr)
        compareDate.setHours(0, 0, 0, 0)
        if (compareDate.toDateString() === currentDate.toDateString()) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
        } else {
            break
        }
    }

    // STABILITY
    const recentRanks = moods.slice(-14).map((m) => Number(m.rank) || 0)
    let stability = 100
    if (recentRanks.length > 1) {
        const mean = recentRanks.reduce((a, b) => a + b, 0) / recentRanks.length
        const variance = recentRanks.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / recentRanks.length
        const stdDev = Math.sqrt(variance)
        stability = Math.max(0, Math.round(100 - stdDev * 20))
    }

    // ---------------------------------------------------
    // TARGETING CURRENT CALENDAR WEEK ONLY (Mon - Sun)
    // ---------------------------------------------------
    const now = new Date()
    
    // Get Monday of the current week
    const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday...
    const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
    
    const mondayOfThisWeek = new Date(now)
    mondayOfThisWeek.setDate(now.getDate() - distanceToMonday)
    mondayOfThisWeek.setHours(0, 0, 0, 0)

    const sundayOfThisWeek = new Date(mondayOfThisWeek)
    sundayOfThisWeek.setDate(mondayOfThisWeek.getDate() + 6)
    sundayOfThisWeek.setHours(23, 59, 59, 999)

    // Filter logs strictly belonging inside this Mon-Sun frame
    const currentWeekMoods = moods.filter((m) => {
        const mDate = new Date(m.date)
        return mDate >= mondayOfThisWeek && mDate <= sundayOfThisWeek
    })

    const positiveDays = currentWeekMoods.filter((m) => ["happy", "excited"].includes(m.mood)).length
    const negativeDays = currentWeekMoods.filter((m) => ["sad", "stressed"].includes(m.mood)).length
    const neutralDays = currentWeekMoods.filter((m) => m.mood === "neutral").length

    const averageThisWeek = currentWeekMoods.length > 0
        ? currentWeekMoods.reduce((sum, m) => sum + (Number(m.rank) || 0), 0) / currentWeekMoods.length
        : 0

    // BEST DAY RESOLUTION FOR CURRENT WEEK
    const weekdayScores: Record<string, number[]> = {}
    for (const mood of currentWeekMoods) {
        const dayName = new Date(mood.date).toLocaleDateString("en-US", { weekday: "long" })
        if (!weekdayScores[dayName]) weekdayScores[dayName] = []
        weekdayScores[dayName].push(Number(mood.rank) || 0)
    }

    let bestDay: string | null = null
    let bestAvg = 0
    Object.entries(weekdayScores).forEach(([day, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        if (avg > bestAvg) {
            bestAvg = avg
            bestDay = day
        }
    })

    // ---------------------------------------------------
    // FIXED CHRONOLOGICAL CALENDAR GENERATION (Mon -> Sun)
    // ---------------------------------------------------
 // ---------------------------------------------------
    // FIXED CHRONOLOGICAL CALENDAR GENERATION (Mon -> Sun)
    // ---------------------------------------------------
    const weeklyTrend = []
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for (let i = 0; i < 7; i++) {
        const targetDayDate = new Date(mondayOfThisWeek)
        targetDayDate.setDate(mondayOfThisWeek.getDate() + i)
        
        // Define exact mathematical start and end boundaries for this calendar day
        const startOfDay = new Date(targetDayDate)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(targetDayDate)
        endOfDay.setHours(23, 59, 59, 999)

        // Find any logs created within this day's time range
        const foundDayLog = currentWeekMoods.find((m) => {
            const logDate = new Date(m.date)
            return logDate >= startOfDay && logDate <= endOfDay
        })

        weeklyTrend.push({
            day: dayLabels[i],
            mood: foundDayLog ? foundDayLog.mood : null,
            // Recharts needs 'null' instead of 0 for missing days so it gracefully stops rendering the line,
            // or a fallback number if you want the line to drop to the bottom.
            rank: foundDayLog ? foundDayLog.rank : null, 
        })
    }

    // RECENT CHECK INS
    const recentCheckIns = moods
        .slice(-5)
        .reverse()
        .map((m) => ({
            mood: m.mood,
            rank: m.rank,
            note: m.note || "",
            date: m.date,
        }))

    // HEATMAP
    const heatmap = moods.map((m) => ({
        date: m.date,
        mood: m.mood,
        rank: m.rank,
    }))

    return NextResponse.json({
        overview: {
            emotionalScore,
            avgRank: Number(avgRank.toFixed(2)),
            streak,
            stability,
            dominantMood,
        },
        weeklyStats: {
            totalCheckIns: currentWeekMoods.length,
            positiveDays,
            negativeDays,
            neutralDays,
            bestDay,
            averageThisWeek: Number(averageThisWeek.toFixed(2)),
        },
        moodBreakdown,
        weeklyTrend,
        recentCheckIns,
        heatmap,
    })
}