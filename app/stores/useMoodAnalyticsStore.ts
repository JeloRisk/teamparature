// stores/useMoodAnalyticsStore.ts
import { create } from "zustand"

interface MoodAnalytics {
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
    detailedSeries: number[]
    moodMetrics: number[]
    moodCounts: number[]
}

const defaultAnalytics: MoodAnalytics = {
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
    moodCounts: []
}

interface MoodAnalyticsStore {
    analytics: MoodAnalytics
    loading: boolean
    error: string | null
    fetchAnalytics: (orgId: string) => Promise<void>
}

export const useMoodAnalyticsStore = create<MoodAnalyticsStore>((set) => ({
    analytics: defaultAnalytics,
    loading: false,
    error: null,

    fetchAnalytics: async (orgId) => {
        set({ loading: true, error: null })
        try {
            const res = await fetch(`/api/orgs/${orgId}/moods/analytics`)
            if (!res.ok) throw new Error("Failed to fetch analytics")
            const data = await res.json()
            set({ analytics: data, loading: false })
        } catch (err: any) {
            set({ error: err.message, loading: false })
        }
    },
}))
