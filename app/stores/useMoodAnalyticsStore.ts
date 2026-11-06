import { create } from "zustand"

interface DetailedSeriesItem {
    day: string
    total: number
    positive?: number
    negative?: number
    avg?: number
}


interface MoodCounts {
    happy: number
    neutral: number
    sad: number
    stressed: number
    excited: number
}

interface MoodAnalytics {
    heatmap: { month: number; day: number; mood: keyof MoodCounts }[]
    year: number
    orgTemperature: number
    avgRank: number
    totalLogs: number
    volatility: number
    positive: number
    negative: number
    posPct: number
    negPct: number
    participants: number
    series: number[]
    detailedSeries: DetailedSeriesItem[]
    moodMetrics: number[]
    moodCounts: MoodCounts
}

const defaultAnalytics: MoodAnalytics = {
    heatmap: [],
    year: new Date().getFullYear(),
    orgTemperature: 0,
    avgRank: 0,
    totalLogs: 0,
    volatility: 0,
    positive: 0,
    negative: 0,
    posPct: 0,
    negPct: 0,
    participants: 0,
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
    orgId: string | null
    analytics: MoodAnalytics
    loading: boolean
    error: string | null
    fetchAnalytics: (orgId: string) => Promise<void>
}

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}

export const useMoodAnalyticsStore = create<MoodAnalyticsStore>((set, get) => ({
    orgId: null,
    analytics: defaultAnalytics,
    loading: false,
    error: null,

    fetchAnalytics: async (orgId) => {
        set({ orgId, loading: true, error: null })
        try {
            const res = await fetch(`/api/orgs/${orgId}/moods/analytics`)
            if (!res.ok) throw new Error("Failed to fetch analytics")
            const data: MoodAnalytics = await res.json()
            if (get().orgId === orgId) set({ analytics: data, loading: false })
        } catch (err: unknown) {
            if (get().orgId === orgId) set({ error: getErrorMessage(err), loading: false })
        }
    },
}))
