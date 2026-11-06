"use client"

import { useMoodStore } from "@/app/stores/useMoodStore"
import MoodTrendsChart from "./MoodTrendsChart"

export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const summary = useMoodStore(state => state.orgId === orgId ? state.summary : null)
    const error = useMoodStore(state => state.orgId === orgId ? state.error : null)
    const fetchSummary = useMoodStore(state => state.fetchSummary)

    if (error) return <button onClick={() => fetchSummary(orgId)}>{error}. Retry</button>
    if (!summary?.trend) return <p>Loading mood trends…</p>
    return <MoodTrendsChart data={summary.trend} />
}
