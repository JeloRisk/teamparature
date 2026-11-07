"use client"

import { ChartSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { useMoodStore } from "@/app/stores/useMoodStore"
import MoodTrendsChart from "./MoodTrendsChart"

export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const summary = useMoodStore(state => state.orgId === orgId ? state.summary : null)
    const error = useMoodStore(state => state.orgId === orgId ? state.error : null)
    const fetchSummary = useMoodStore(state => state.fetchSummary)

    if (error) return <button onClick={() => fetchSummary(orgId)}>{error}. Retry</button>
    if (!summary?.trend) return <ChartSkeleton />
    return <MoodTrendsChart data={summary.trend} />
}
