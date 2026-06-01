import { create } from "zustand"

export interface MoodOverview {
    emotionalScore: number
    avgRank: number
    streak: number
    stability: number
    dominantMood: string | null
}

export interface WeeklyStats {
    totalCheckIns: number
    positiveDays: number
    negativeDays: number
    neutralDays: number
    bestDay: string | null
    averageThisWeek: number
}

export interface MoodBreakdown {
    happy: number
    excited: number
    neutral: number
    sad: number
    stressed: number
}

export interface WeeklyTrendItem {
    day: string
    mood: string | null
    rank: number
}

export interface RecentCheckIn {
    mood: string
    rank: number
    note: string
    date: string
}

export interface HeatmapItem {
    date: string
    mood: string
    rank: number
}

export interface MyMoodAnalytics {
    overview: MoodOverview
    weeklyStats: WeeklyStats
    moodBreakdown: MoodBreakdown
    weeklyTrend: WeeklyTrendItem[]
    recentCheckIns: RecentCheckIn[]
    heatmap: HeatmapItem[]
}

type State = {
    analytics: MyMoodAnalytics | null
    loading: boolean
    error: string | null

    fetchMyMoodAnalytics: () => Promise<void>
    clearAnalytics: () => void
}

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}

export const useMyMood = create<State>((set) => ({
    analytics: null,
    loading: false,
    error: null,

    clearAnalytics: () => {
        set({
            analytics: null,
        })
    },

   fetchMyMoodAnalytics: async () => {
    console.log("Initiating fetchMyMoodAnalytics...")
        set({
            loading: true,
            error: null,
        })

        try {
            const res = await fetch("/api/me/mood")
            console.log("RAW RESPONSE FROM /api/me/mood:", res)

            if (!res.ok) {
                throw new Error("Failed to fetch mood analytics")
            }

            const jsonResponse = await res.json()

            // FIX: Check if your backend wraps the payload inside an object key like 'data' or 'analytics'
            // If it returns the raw object directly, it falls back cleanly to jsonResponse.
            const cleanData = jsonResponse.data || jsonResponse.analytics || jsonResponse

            set({
                analytics: cleanData,
                loading: false,
            })
        } catch (err) {
            set({
                error: getErrorMessage(err),
                loading: false,
            })
        }
    },
}))