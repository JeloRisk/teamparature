"use client"


import { AnalyticsSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import MoodHeatmap from "./MoodHeatmap"
import { useMoodAnalyticsStore } from "@/app/stores/useMoodAnalyticsStore"

import {
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    CartesianGrid,
} from "recharts"
import KpiCard from "./components/analytics/KpiCard"
import ChartCard from "./components/analytics/ChartCard"
import { ChevronDown } from "lucide-react"

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
    purple: "#8b5cf6",
}
const ASH = "#a3a3a3"

type MoodType = "happy" | "neutral" | "sad" | "stressed" | "excited"

const MOOD_COLORS: Record<MoodType, string> = {
    happy: FIRE.glow,
    excited: FIRE.ember,
    neutral: ASH,
    sad: ICE.ice,
    stressed: ICE.purple,
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

    const radarData = (Object.keys(MOOD_COLORS) as MoodType[])
        .map(mood => ({
            name: mood.charAt(0).toUpperCase() + mood.slice(1),
            value: moodCounts[mood],
            color: MOOD_COLORS[mood],
        }))
    const highestMoodCount = Math.max(0, ...radarData.map(item => item.value))
    const firstTopMood = radarData.find(item => item.value === highestMoodCount)
    const radarColor = highestMoodCount > 0 && firstTopMood
        ? MOOD_COLORS[firstTopMood.name.toLowerCase() as MoodType]
        : "var(--primary)"

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
        <div className="analytics-page min-w-0 space-y-4" aria-busy={loading}>
            {loading && <p role="status" className="text-xs text-muted-foreground">Updating analytics…</p>}
            {error && <p role="alert" className="text-sm text-muted-foreground">{error}. Showing the last loaded report. <button className="text-primary underline" onClick={() => fetchAnalytics(orgId, true)}>Retry</button></p>}


            {/* Page heading follows the dashboard title hierarchy. */}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Team mood</h1>
                </div>
            </header>

            {/* Summary metrics */}
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Team temperature"
                    value={gaugeValue === null ? "—" : `${gaugeValue}%`}
                    sub={`${analytics.positive} of ${analytics.totalLogs} check-ins were Happy or Excited`}
                />

                <KpiCard
                    title="Check-ins"
                    value={analytics.totalLogs}
                    sub={`${analytics.participants} of ${analytics.activeMembers} active members · ${participationRate}% participation`}
                />

                <KpiCard
                    title="Intensity variation"
                    value={analytics.volatility ?? "—"}
                    sub="Across days with check-ins"
                />

                <KpiCard
                    title="Average intensity"
                    value={avgRank === null ? "—" : `${avgRank.toFixed(2)} / 5`}
                    sub="Strength of feeling across all mood types"
                />
            </div>

            {/* Mood distribution and volume share a row for a clearer first read. */}
            <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <ChartCard title="Mood distribution" contentClassName="h-auto">
                    {!analytics.totalLogs ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No check-ins in this period.</p> : (
                        <div className="h-[23rem] min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart accessibilityLayer data={radarData} outerRadius="76%" margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                        <PolarGrid stroke="var(--border)" />
                                        <PolarAngleAxis dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 12 }} tickLine={false} />
                                        <PolarRadiusAxis domain={[0, Math.max(4, ...radarData.map(item => item.value))]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} allowDecimals={false} axisLine={false} angle={90} />
                                    <Radar isAnimationActive={false} name="Check-ins" dataKey="value" stroke={radarColor} fill={radarColor} fillOpacity={0.24} strokeWidth={2} dot={{ r: 3, fill: radarColor, strokeWidth: 0 }} />
                                        <Tooltip cursor={false} contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                <ChartCard
                    title={`${trendUnit.charAt(0).toUpperCase() + trendUnit.slice(1)} check-ins by mood`}
                    action={<ul aria-label="Mood legend" className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                        {(Object.keys(MOOD_COLORS) as MoodType[]).map(mood => <li key={mood} className="flex items-center gap-1.5 capitalize"><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: MOOD_COLORS[mood] }} />{mood}</li>)}
                    </ul>}
                    contentClassName="h-[23rem]"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trend.data} barSize={22}>
                            <CartesianGrid vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} tickLine={false} axisLine={false} tickMargin={10} fontSize={12} stroke="var(--muted-foreground)" />
                            <YAxis width={28} allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                            <Tooltip labelFormatter={(_label, items) => (items?.[0]?.payload as TrendBucket | undefined)?.range ?? String(_label)} contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
                            {(Object.keys(MOOD_COLORS) as MoodType[]).map((mood, index, moods) => (
                                <Bar isAnimationActive={false} key={mood} dataKey={mood} name={mood.charAt(0).toUpperCase() + mood.slice(1)} stackId="moods" fill={MOOD_COLORS[mood]} shape={(props: unknown) => {
                                    const rect = props as { x: number; y: number; width: number; height: number; fill: string; payload?: Record<string, number> }
                                    const topMood = [...moods].reverse().find(key => (rect.payload?.[key] ?? 0) > 0)
                                    const radius = topMood === mood ? Math.min(5, rect.width / 2, rect.height / 2) : 0
                                    const right = rect.x + rect.width
                                    const bottom = rect.y + rect.height
                                    const path = `M ${rect.x + radius} ${rect.y} H ${right - radius} Q ${right} ${rect.y} ${right} ${rect.y + radius} V ${bottom} H ${rect.x} V ${rect.y + radius} Q ${rect.x} ${rect.y} ${rect.x + radius} ${rect.y} Z`
                                    return <path d={path} fill={rect.fill} />
                                }} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Mood patterns by weekday" contentClassName="h-auto">
                <div className="grid min-w-0 grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1 sm:grid-cols-[4.5rem_repeat(7,minmax(1.5rem,1fr))] sm:gap-2" role="table" aria-label={`Mood check-in counts by weekday, ${weekdayRange}`}>
                    <div role="columnheader" className="pb-2" />
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <div key={day} role="columnheader" className="pb-2 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
                            {day}<span className="mt-0.5 block text-[9px] font-normal sm:text-[10px]">{analytics.weekdayMoods[index]?.total ?? 0}</span>
                        </div>
                    ))}
                    {(Object.keys(MOOD_COLORS) as MoodType[]).map(mood => (
                        <div key={mood} className="contents" role="row">
                            <div role="rowheader" className="flex items-center text-[11px] capitalize text-muted-foreground sm:text-xs">{mood}</div>
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
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} tickLine={false} axisLine={false} tickMargin={10} fontSize={12} stroke="var(--muted-foreground)" />
                        <YAxis width={28} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                        <Tooltip labelFormatter={(_label, items) => (items?.[0]?.payload as TrendBucket | undefined)?.range ?? String(_label)} contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)" }} />
                        <Line isAnimationActive={false} type="linear" dataKey="avg" name="Average intensity (1–5)" connectNulls={false} stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: "var(--card)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <MoodHeatmap moods={analytics.heatmap} year={analytics.year} timezone={analytics.timezone} asOfDate={analytics.heatmapAsOfDate} latestYear={Number(analytics.asOfDate.slice(0, 4))} onYearChange={year => fetchAnalytics(orgId, true, { ...selectedRange, year })} />
        </div>
    )
}
