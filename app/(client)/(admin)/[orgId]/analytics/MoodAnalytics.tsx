"use client"


import { AnalyticsSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import MoodHeatmap from "./MoodHeatmap"
import { useMoodAnalyticsStore } from "@/app/stores/useMoodAnalyticsStore"

import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
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
import { Flame, Snowflake, Activity, Users } from "lucide-react"
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

    // Gauge Data (Org Temperature)
    const gaugeValue = analytics.orgTemperature
    const gaugeData = [{ name: "Org Temperature", value: gaugeValue ?? 0 }]



    const temperatureChange = gaugeValue !== null && analytics.previousTemperature !== null
        ? gaugeValue - analytics.previousTemperature
        : null
    const checkInChange = analytics.totalLogs - analytics.previousTotalLogs
    const participationRate = analytics.activeMembers
        ? Math.round(analytics.participants * 100 / analytics.activeMembers)
        : 0
    const trend = aggregateTrend(analytics.detailedSeries, analytics.periodDays)
    const trendUnit = trend.granularity === "day" ? "daily" : trend.granularity === "week" ? "weekly" : "monthly"
    const leadingCount = Math.max(...Object.values(moodCounts))
    const leadingMoods = analytics.totalLogs
        ? (Object.entries(moodCounts) as [MoodType, number][])
            .filter(([, count]) => count === leadingCount)
            .map(([mood]) => mood)
        : []
    const leadingLabel = leadingMoods.map(mood => mood.charAt(0).toUpperCase() + mood.slice(1)).join(" and ")
    const leadingShare = analytics.totalLogs ? Math.round(leadingCount * 100 / analytics.totalLogs) : 0
    const volumeDirection = checkInChange > 0 ? "more" : checkInChange < 0 ? "fewer" : "the same number of"
    const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: analytics.timezone })
    const currentRange = `${dateFormat.format(new Date(analytics.periodStart))} – ${dateFormat.format(new Date(new Date(analytics.periodEnd).getTime() - 1))}`
    const previousRange = `${dateFormat.format(new Date(analytics.previousPeriodStart))} – ${dateFormat.format(new Date(new Date(analytics.previousPeriodEnd).getTime() - 1))}`
    const weekdayRange = `${dateFormat.format(new Date(analytics.weekdayPeriodStart))} – ${dateFormat.format(new Date(new Date(analytics.weekdayPeriodEnd).getTime() - 1))}`


    //
    // --- Render ---
    //
    return (
        <div className="analytics-page space-y-6" aria-busy={loading}>
            {loading && <p role="status" className="text-xs text-muted-foreground">Updating analytics…</p>}
            {error && <p role="alert" className="text-sm text-muted-foreground">{error}. Showing the last loaded report. <button className="text-primary underline" onClick={() => fetchAnalytics(orgId, true)}>Retry</button></p>}


            {/* Section Header */}
            <div className="rounded-xl p-4 bg-gradient-to-r dark:bg-none from-sky-50 via-white to-orange-50 border border-border dark:border-border">
                <div className="flex items-center gap-2">
                    <Snowflake className="w-5 h-5 text-sky-500" />
                    <h3 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-muted-foreground">
                        Team mood · Selected period ({analytics.periodDays} days)
                    </h3>
                    <Flame className="w-5 h-5 text-orange-500 ml-auto" />
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Team temperature"
                    value={gaugeValue === null ? "—" : `${gaugeValue === null ? "No check-ins" : `${gaugeValue}%`}`}
                    sub={`${analytics.positive} Happy or Excited out of ${analytics.totalLogs} check-ins`}
                    glow="from-orange-50 to-sky-50"
                    icon={<Activity className="w-5 h-5 text-orange-600 dark:text-[#e1c590]" />}
                />

                <KpiCard
                    title={`Check-ins · ${analytics.periodDays} days`}
                    value={analytics.totalLogs}
                    sub={`${analytics.participants} of ${analytics.activeMembers} active members · ${participationRate}% participation`}
                    glow="from-slate-50 to-slate-50"
                    icon={<Users className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />}
                />

                <KpiCard
                    title="Intensity variation (σ)"
                    value={analytics.volatility ?? "—"}
                    sub="Daily average intensity · at least 2 days with responses"
                    glow="from-sky-50 to-orange-50"
                    icon={<Snowflake className="w-5 h-5 text-sky-600" />}
                />

                <KpiCard
                    title="Average intensity"
                    value={avgRank === null ? "—" : `${avgRank.toFixed(2)} / 5`}
                    sub="Strength of feeling across all mood types"
                    glow="from-orange-50 to-sky-50"
                    icon={<Flame className="w-5 h-5 text-orange-600 dark:text-[#e1c590]" />}
                />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight">Team insights</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Current period: {currentRange} · Compared with {previousRange} ({analytics.timezone}).</p>
                </div>
                {analytics.totalLogs === 0 ? (
                    <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">There are no check-ins in this period yet. Insights will appear as the team checks in.</p>
                ) : (
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-muted/40 p-4">
                            <p className="text-xs font-medium text-muted-foreground">Most selected mood</p>
                            <p className="mt-2 text-lg font-semibold">{leadingLabel}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{leadingCount} of {analytics.totalLogs} check-ins · {leadingShare}%</p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-4">
                            <p className="text-xs font-medium text-muted-foreground">Team temperature</p>
                            <p className="mt-2 text-lg font-semibold">
                                {temperatureChange === null ? "Not enough comparison data" : temperatureChange === 0 ? "Holding steady" : `${Math.abs(temperatureChange)} points ${temperatureChange > 0 ? "higher" : "lower"}`}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {temperatureChange === null
                                    ? `${analytics.totalLogs} check-ins now; ${analytics.previousTotalLogs} in the prior period`
                                    : `${gaugeValue}% now vs ${analytics.previousTemperature}% in the previous period`}
                            </p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-4">
                            <p className="text-xs font-medium text-muted-foreground">Participation</p>
                            <p className="mt-2 text-lg font-semibold">{analytics.participants} of {analytics.activeMembers} active members</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {analytics.activeMembers ? `${participationRate}% checked in · ` : "No active members · "}
                                {checkInChange === 0 ? "same check-in volume as the prior period" : `${Math.abs(checkInChange)} ${volumeDirection} check-ins than the prior period`}
                            </p>
                        </div>
                    </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">These are team-level patterns from voluntary check-ins. They show what people reported, not why they feel that way.</p>
            </section>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Gauge */}
                <ChartCard title="Team temperature">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="100%"
                            barSize={22}
                            data={gaugeData}
                            startAngle={180}
                            endAngle={0}
                        >
                            <defs>
                                <linearGradient id="gaugeFireIce" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={ICE.blue} />
                                    <stop offset="100%" stopColor={FIRE.ember} />
                                </linearGradient>
                            </defs>
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={12}
                                fill="url(#gaugeFireIce)"
                            />
                            <text
                                x="50%"
                                y="55%"
                                textAnchor="middle"
                                fontSize={24}
                                fontWeight={600}
                                fill="var(--foreground)"
                            >
                                {gaugeValue === null ? "No check-ins" : `${gaugeValue}%`}
                            </text>
                            <text
                                x="50%"
                                y="70%"
                                textAnchor="middle"
                                fontSize={12}
                                fill="var(--muted-foreground)"
                            >
                                Happy or Excited check-ins
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Pie */}
                <ChartCard title={`Mood distribution · ${analytics.periodDays} days`}>
                    {!analytics.totalLogs ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No check-ins in this period.</p> : <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                                label={(d) => `${d.name} (${d.value})`}
                            >
                                {pieData.map((d, i) => (
                                    <Cell key={i} fill={d.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
                        </PieChart>
                    </ResponsiveContainer>}
                </ChartCard>
            </div>

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

            <ChartCard title="Mood patterns by weekday">
                <p className="mb-4 text-xs text-muted-foreground">{weekdayRange} · Check-in counts by weekday in {analytics.timezone}. Hover a cell to see its count.</p>
                <div className="grid grid-cols-[5.25rem_repeat(7,minmax(2.25rem,1fr))] gap-1.5 sm:gap-2" role="table" aria-label="Mood check-ins by weekday over the last 90 days">
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
