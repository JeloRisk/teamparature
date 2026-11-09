"use client"


import { AnalyticsSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import MoodHeatmap from "./MoodHeatmap"
import { useMoodAnalyticsStore } from "@/app/stores/useMoodAnalyticsStore"
import { useWorkspace } from "../ClientDashboardLayout"

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
} from "recharts"
import KpiCard from "./components/analytics/KpiCard"
import ChartCard from "./components/analytics/ChartCard"

//
// --- Constants ---
//
const FIRE = {
    red: "#ef4444",
    ember: "#f97316",
    glow: "#fb923c",
}
const ICE = {
    blue: "#3b82f6",
    ice: "#60a5fa",
    frost: "#93c5fd",
}
const ASH = "#a3a3a3"

type MoodType = "happy" | "neutral" | "sad" | "stressed" | "excited"

const MOOD_COLORS: Record<MoodType, string> = {
    happy: FIRE.glow,
    excited: FIRE.ember,
    neutral: ASH,
    sad: ICE.ice,
    stressed: ICE.blue,
}

//
type TrendBucket = {
    key: string
    label: string
    range: string
    total: number
    rankSum: number
    avg: number | null
    rangeStart: string
    rangeEnd: string
} & Record<MoodType, number>

function aggregateTrend(series: Array<{ dateKey: string; day: string; total: number; rankSum: number; avg?: number | null } & Record<MoodType, number>>, days: number) {
    const granularity = days <= 30 ? "day" : days <= 120 ? "week" : "month"
    const buckets = new Map<string, TrendBucket>()
    const dateLabel = (key: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`))

    for (const item of series) {
        const date = new Date(`${item.dateKey}T00:00:00Z`)
        let key = item.dateKey
        if (granularity === "week") {
            date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
            key = date.toISOString().slice(0, 10)
        } else if (granularity === "month") {
            key = `${item.dateKey.slice(0, 7)}-01`
        }
        const bucket = buckets.get(key) ?? {
            key,
            label: granularity === "day" ? item.day : granularity === "month"
                ? new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`))
                : dateLabel(key),
            range: "",
            total: 0,
            rankSum: 0,
            avg: null,
            happy: 0,
            neutral: 0,
            sad: 0,
            stressed: 0,
            excited: 0,
            rangeStart: item.dateKey,
            rangeEnd: item.dateKey,
        } as TrendBucket
        bucket.total += item.total
        bucket.rankSum += item.rankSum
        for (const mood of Object.keys(MOOD_COLORS) as MoodType[]) bucket[mood] += item[mood]
        bucket.rangeStart = bucket.rangeStart < item.dateKey ? bucket.rangeStart : item.dateKey
        bucket.rangeEnd = bucket.rangeEnd > item.dateKey ? bucket.rangeEnd : item.dateKey
        bucket.avg = bucket.total ? bucket.rankSum / bucket.total : null
        bucket.range = bucket.rangeStart === bucket.rangeEnd
            ? dateLabel(bucket.rangeStart)
            : `${dateLabel(bucket.rangeStart)} – ${dateLabel(bucket.rangeEnd)}`
        buckets.set(key, bucket)
    }

    return { granularity, data: [...buckets.values()] }
}

// --- Component ---
//
export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { organization } = useWorkspace()
    const { analytics, loading, error, orgId: loadedOrgId, fetchAnalytics, selectedRange } = useMoodAnalyticsStore()
    if (error && !analytics.periodStart) return <div role="alert" className="rounded-xl border border-border p-4">
        <p>{error}</p><button className="mt-2 text-primary underline" onClick={() => fetchAnalytics(orgId, true)}>Retry</button>
    </div>
    if (loadedOrgId !== orgId || !analytics.periodStart) return <AnalyticsSkeleton />

    const { avgRank } = analytics

    const moodCounts = analytics.moodCounts || {
        happy: 0,
        excited: 0,
        neutral: 0,
        sad: 0,
        stressed: 0,
    }

    // Pie Data
    const pieData = (Object.entries(moodCounts) as [MoodType, number][])
        .map(([mood, value]) => ({
            name: mood,
            value,
            color: MOOD_COLORS[mood],
        }))
        .filter((d) => d.value > 0)

    const gaugeValue = analytics.orgTemperature



    const participationRate = analytics.activeMembers
        ? Math.round(analytics.participants * 100 / analytics.activeMembers)
        : 0
    const trend = aggregateTrend(analytics.detailedSeries, analytics.periodDays)
    const trendUnit = trend.granularity === "day" ? "daily" : trend.granularity === "week" ? "weekly" : "monthly"
    const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: analytics.timezone })
    const weekdayRange = `${dateFormat.format(new Date(analytics.weekdayPeriodStart))} – ${dateFormat.format(new Date(new Date(analytics.weekdayPeriodEnd).getTime() - 1))}`


    //
    // --- Render ---
    //
    return (
        <div className="analytics-page min-w-0 space-y-6" aria-busy={loading}>
            {loading && <p role="status" className="text-xs text-muted-foreground">Updating analytics…</p>}
            {error && <p role="alert" className="text-sm text-muted-foreground">{error}. Showing the last loaded report. <button className="text-primary underline" onClick={() => fetchAnalytics(orgId, true)}>Retry</button></p>}


            {/* Page heading follows the dashboard title hierarchy. */}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Team mood</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">{organization.name}</p>
                </div>
            </header>

            {/* Summary metrics */}
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Team temperature"
                    value={gaugeValue === null ? "—" : `${gaugeValue}%`}
                    sub={`${analytics.positive} positive check-ins of ${analytics.totalLogs}`}
                />

                <KpiCard
                    title="Check-ins"
                    value={analytics.totalLogs}
                    sub={`${analytics.participants} of ${analytics.activeMembers} active members · ${participationRate}% participation`}
                />

                <KpiCard
                    title="Intensity variation (σ)"
                    value={analytics.volatility ?? "—"}
                    sub="Daily average intensity · at least 2 days with responses"
                />

                <KpiCard
                    title="Average intensity"
                    value={avgRank === null ? "—" : `${avgRank.toFixed(2)} / 5`}
                    sub="Strength of feeling across all mood types"
                />
            </div>

            {/* Mood distribution and volume share a row for a clearer first read. */}
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title={`Mood distribution · ${analytics.periodDays} days`}>
                    {!analytics.totalLogs ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No check-ins in this period.</p> : (
                        <div className="grid h-full min-w-0 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,0.85fr)] sm:grid-rows-1 sm:gap-4">
                            <div className="min-h-0 min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius="54%"
                                            outerRadius="78%"
                                            paddingAngle={3}
                                        >
                                            {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:flex-col sm:justify-center sm:gap-2" aria-label="Check-in counts by mood">
                                {(Object.keys(MOOD_COLORS) as MoodType[]).map(mood => (
                                    <li key={mood} className="flex min-w-0 items-center gap-2 text-xs capitalize text-muted-foreground">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: MOOD_COLORS[mood] }} aria-hidden="true" />
                                        <span className="min-w-0 flex-1 truncate">{mood}</span>
                                        <span className="tabular-nums text-foreground">{moodCounts[mood]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </ChartCard>

                <ChartCard title={`${trendUnit.charAt(0).toUpperCase() + trendUnit.slice(1)} check-ins by mood`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trend.data} barSize={22}>
                            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={14} stroke="var(--muted-foreground)" />
                            <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                            <Tooltip labelFormatter={(_label, items) => (items?.[0]?.payload as TrendBucket | undefined)?.range ?? String(_label)} contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
                            {(Object.keys(MOOD_COLORS) as MoodType[]).map((mood, index, moods) => (
                                <Bar key={mood} dataKey={mood} name={mood.charAt(0).toUpperCase() + mood.slice(1)} stackId="moods" fill={MOOD_COLORS[mood]} radius={index === moods.length - 1 ? [5, 5, 0, 0] : 0} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Mood patterns by weekday">
                <p className="mb-4 text-xs text-muted-foreground">{weekdayRange} · Check-in counts by weekday in {analytics.timezone}. Hover a cell to see its count.</p>
                <div className="grid min-w-0 grid-cols-[3rem_repeat(7,minmax(0,1fr))] gap-0.5 sm:grid-cols-[4rem_repeat(7,minmax(1.5rem,1fr))] sm:gap-1.5" role="table" aria-label="Mood check-ins by weekday over the last 90 days">
                    <div role="columnheader" className="pb-2" />
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <div key={day} role="columnheader" className="pb-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
                            {day}<span className="mt-0.5 block text-[9px] font-normal sm:text-[10px]">{analytics.weekdayMoods[index]?.total ?? 0}</span>
                        </div>
                    ))}
                    {(Object.keys(MOOD_COLORS) as MoodType[]).map(mood => (
                        <div key={mood} className="contents" role="row">
                            <div role="rowheader" className="flex items-center text-[10px] capitalize text-muted-foreground sm:text-xs">{mood}</div>
                            {analytics.weekdayMoods.map(day => {
                                const count = day.counts[mood] ?? 0
                                const maxCount = Math.max(1, ...analytics.weekdayMoods.flatMap(item => Object.values(item.counts)))
                                const opacity = count ? Math.max(16, Math.round(count / maxCount * 76)) : 0
                                return <div key={day.weekday} role="cell" title={`${mood}: ${count} check-ins on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.weekday - 1]}`} aria-label={`${mood}: ${count} check-ins`} className="grid h-9 place-items-center rounded-lg border border-border/50 text-xs font-medium" style={{ backgroundColor: count ? `color-mix(in srgb, ${MOOD_COLORS[mood]} ${opacity}%, var(--card))` : "var(--muted)" }}>{count || "—"}</div>
                            })}
                        </div>
                    ))}
                </div>
            </ChartCard>

            <ChartCard title={`${trendUnit.charAt(0).toUpperCase() + trendUnit.slice(1)} intensity`}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.data}>
                        <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={14} stroke="var(--muted-foreground)" />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="var(--muted-foreground)" />
                        <Tooltip labelFormatter={(_label, items) => (items?.[0]?.payload as TrendBucket | undefined)?.range ?? String(_label)} contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)" }} />
                        <Line type="linear" dataKey="avg" name="Average intensity (1–5)" connectNulls={false} stroke="var(--primary)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <MoodHeatmap moods={analytics.heatmap} year={analytics.year} timezone={analytics.timezone} asOfDate={analytics.heatmapAsOfDate} latestYear={Number(analytics.asOfDate.slice(0, 4))} onYearChange={year => fetchAnalytics(orgId, true, { ...selectedRange, year })} />
        </div>
    )
}
