import type { HeatmapCell, HeatmapDay } from "@/lib/mood-heatmap"
import { create } from "zustand"

interface DetailedSeriesItem {
    dateKey: string
    day: string
    rankSum: number
    total: number
    happy: number
    excited: number
    neutral: number
    sad: number
    stressed: number
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
    periodDays: number
    previousPeriodStart: string
    previousPeriodEnd: string
    weekdayPeriodStart: string
    weekdayPeriodEnd: string
    asOfDate: string
    heatmapAsOfDate: string
    heatmap: HeatmapCell[]
    heatmapDays: HeatmapDay[]
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
    periodDays: 14,
    previousPeriodStart: "",
    previousPeriodEnd: "",
    weekdayPeriodStart: "",
    weekdayPeriodEnd: "",
    asOfDate: "",
    heatmapAsOfDate: "",
    heatmap: [],
    heatmapDays: [],
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
    rangeKey: string
    selectedRange: { days?: number; from?: string; to?: string; year?: number }
    fetchedAt: number
    orgId: string | null
    analytics: MoodAnalytics
    loading: boolean
    error: string | null
    fetchAnalytics: (orgId: string, force?: boolean, range?: { days?: number; from?: string; to?: string; year?: number }) => Promise<void>
}

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}

export const useMoodAnalyticsStore = create<MoodAnalyticsStore>((set, get) => ({
    requestId: 0,
    rangeKey: "",
    selectedRange: { days: 14 },
    fetchedAt: 0,
    orgId: null,
    analytics: defaultAnalytics,
    loading: false,
    error: null,

    fetchAnalytics: async (orgId, force = false, range) => {
        const current = get()
        const selectedRange = range ?? (current.orgId === orgId ? current.selectedRange : { days: 14 })
        const rangeKey = `${selectedRange.from && selectedRange.to ? `${selectedRange.from}:${selectedRange.to}` : `${selectedRange.days ?? 14}d`}:${selectedRange.year ?? "current"}`
        if (current.orgId === orgId && current.loading && current.rangeKey === rangeKey) return
        if (!force && current.orgId === orgId && current.rangeKey === rangeKey && Date.now() - current.fetchedAt < 30000) return
        const requestId = current.requestId + 1
        set({
            requestId,
            orgId,
            rangeKey,
            selectedRange,
            analytics: current.orgId === orgId ? current.analytics : defaultAnalytics,
            fetchedAt: current.orgId === orgId ? current.fetchedAt : 0,
            loading: true,
            error: null,
        })
        try {
            const query = selectedRange.from && selectedRange.to
                ? new URLSearchParams({ from: selectedRange.from, to: selectedRange.to })
                : new URLSearchParams({ days: String(selectedRange.days ?? 14) })
            if (selectedRange.year) query.set("year", String(selectedRange.year))
            const res = await fetch(`/api/orgs/${orgId}/moods/analytics?${query}`, { signal: AbortSignal.timeout(20000) })
            if (!res.ok) {
                if (get().requestId === requestId && (res.status === 401 || res.status === 403))
                    set({ analytics: defaultAnalytics, fetchedAt: 0 })
                const body = await res.json().catch(() => null) as { error?: string } | null
                throw new Error(body?.error || "Failed to fetch analytics")
            }
            const data: MoodAnalytics = await res.json()
            if (get().requestId === requestId) set({ analytics: data, loading: false, fetchedAt: Date.now() })
        } catch (err: unknown) {
            if (get().requestId === requestId) set({ error: getErrorMessage(err), loading: false })
        }
    },
}))
