import type { HeatmapCell } from "@/lib/mood-heatmap"
import { create } from "zustand"

interface DetailedSeriesItem {
    day: string
    total: number
    positive?: number
    negative?: number
    avg?: number | null
}


interface WeekdayMood {
    weekday: number
    total: number
    counts: Record<"happy" | "neutral" | "sad" | "stressed" | "excited", number>
}

interface MoodCounts {
    happy: number
    neutral: number
    sad: number
    stressed: number
    excited: number
}

interface MoodAnalytics {
    timezone: string
    periodStart: string
    periodEnd: string
    heatmap: HeatmapCell[]
    year: number
    orgTemperature: number | null
    avgRank: number | null
    totalLogs: number
    volatility: number | null
    positive: number
    negative: number
    posPct: number
    negPct: number
    participants: number
    activeMembers: number
    previousTotalLogs: number
    previousTemperature: number | null
    weekdayMoods: WeekdayMood[]
    series: number[]
    detailedSeries: DetailedSeriesItem[]
    moodMetrics: number[]
    moodCounts: MoodCounts
}

const defaultAnalytics: MoodAnalytics = {
    timezone: "UTC",
    periodStart: "",
    periodEnd: "",
    heatmap: [],
    year: new Date().getFullYear(),
    orgTemperature: null,
    avgRank: null,
    totalLogs: 0,
    volatility: null,
    positive: 0,
    negative: 0,
    posPct: 0,
    negPct: 0,
    participants: 0,
    activeMembers: 0,
    previousTotalLogs: 0,
    previousTemperature: null,
    weekdayMoods: [],
    series: [],
    detailedSeries: [],
    moodMetrics: [],
    moodCounts: {
        happy: 0,
        neutral: 0,
        sad: 0,
        stressed: 0,
        excited: 0,
    },
}

interface MoodAnalyticsStore {
    requestId: number
    fetchedAt: number
    orgId: string | null
    analytics: MoodAnalytics
    loading: boolean
    error: string | null
    fetchAnalytics: (orgId: string, force?: boolean) => Promise<void>
}

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}

export const useMoodAnalyticsStore = create<MoodAnalyticsStore>((set, get) => ({
    requestId: 0,
    fetchedAt: 0,
    orgId: null,
    analytics: defaultAnalytics,
    loading: false,
    error: null,

    fetchAnalytics: async (orgId, force = false) => {
        const current = get()
        if (current.orgId === orgId && current.loading) return
        if (!force && current.orgId === orgId && Date.now() - current.fetchedAt < 30000) return
        const requestId = current.requestId + 1
        set({
            requestId,
            orgId,
            analytics: current.orgId === orgId ? current.analytics : defaultAnalytics,
            fetchedAt: current.orgId === orgId ? current.fetchedAt : 0,
            loading: true,
            error: null,
        })
        try {
            const res = await fetch(`/api/orgs/${orgId}/moods/analytics`, { signal: AbortSignal.timeout(20000) })
            if (!res.ok) {
                if (get().requestId === requestId && (res.status === 401 || res.status === 403))
                    set({ analytics: defaultAnalytics, fetchedAt: 0 })
                throw new Error("Failed to fetch analytics")
            }
            const data: MoodAnalytics = await res.json()
            if (get().requestId === requestId) set({ analytics: data, loading: false, fetchedAt: Date.now() })
        } catch (err: unknown) {
            if (get().requestId === requestId) set({ error: getErrorMessage(err), loading: false })
        }
    },
}))
