"use client"


import { AnalyticsSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import MoodHeatmap from "./MoodHeatmap"
import AnalyticsRangePicker from "./AnalyticsRangePicker"
import { useMoodAnalyticsStore } from "@/app/stores/useMoodAnalyticsStore"
import MoodIcon, { type MoodName } from "@/app/components/MoodIcon"

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    CartesianGrid,
} from "recharts"
import ChartCard from "./components/analytics/ChartCard"

//
// --- Constants ---
//
type MoodType = "happy" | "neutral" | "sad" | "stressed" | "excited"

const MOOD_COLORS: Record<MoodType, string> = {
    happy: "var(--mood-happy)",
    excited: "var(--mood-excited)",
    neutral: "var(--mood-neutral)",
    sad: "var(--mood-sad)",
    stressed: "var(--mood-stressed)",
}

const MOOD_ORDER: MoodType[] = ["happy", "excited", "neutral", "sad", "stressed"]

type MoodDistributionItem = {
    mood: MoodType
    name: string
    value: number
    color: string
    share: number
}

function createMoodDistributionSegments(items: MoodDistributionItem[], total: number) {
    let angle = 180

    return items.flatMap(item => {
        if (!item.value || total <= 0) return []

        const sweep = item.value / total * 180
        const inset = Math.min(1.5, sweep * 0.12)
        const startAngle = angle - inset
        const endAngle = angle - sweep + inset
        angle -= sweep

        const point = (degrees: number) => {
            const radians = degrees * Math.PI / 180
            return {
                x: 160 + 116 * Math.cos(radians),
                y: 150 - 116 * Math.sin(radians),
            }
        }
        const start = point(startAngle)
        const end = point(endAngle)

        return [{
            ...item,
            path: `M ${start.x} ${start.y} A 116 116 0 0 1 ${end.x} ${end.y}`,
        }]
    })
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
    const granularity = days <= 30 ? "day" : days <= 60 ? "week" : "month"
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

function createWavePath(points: Array<{ x: number; y: number | null }>) {
    const paths: string[] = []
    let segment: Array<{ x: number; y: number }> = []
    const flush = () => {
        if (segment.length > 1) {
            let path = `M ${segment[0].x} ${segment[0].y}`
            for (let index = 1; index < segment.length; index++) {
                const previous = segment[index - 1]
                const point = segment[index]
                const control = (previous.x + point.x) / 2
                path += ` C ${control} ${previous.y} ${control} ${point.y} ${point.x} ${point.y}`
            }
            paths.push(path)
        }
        segment = []
    }

    for (const point of points) {
        if (point.y === null) flush()
        else segment.push({ x: point.x, y: point.y })
    }
    flush()
    return paths.join(" ")
}

function createWaveAreaPath(points: Array<{ x: number; y: number | null }>) {
    const paths: string[] = []
    let segment: Array<{ x: number; y: number }> = []
    const flush = () => {
        if (segment.length > 1) {
            let path = `M ${segment[0].x} 160 L ${segment[0].x} ${segment[0].y}`
            for (let index = 1; index < segment.length; index++) {
                const previous = segment[index - 1]
                const point = segment[index]
                const control = (previous.x + point.x) / 2
                path += ` C ${control} ${previous.y} ${control} ${point.y} ${point.x} ${point.y}`
            }
            path += ` L ${segment[segment.length - 1].x} 160 Z`
            paths.push(path)
        }
        segment = []
    }

    for (const point of points) {
        if (point.y === null) flush()
        else segment.push({ x: point.x, y: point.y })
    }
    flush()
    return paths.join(" ")
}

// --- Component ---
//
export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { analytics, loading, error, orgId: loadedOrgId, fetchAnalytics, selectedRange } = useMoodAnalyticsStore()
    if (error && !analytics.periodStart) return <div role="alert" className="rounded-xl border border-border p-4">
        <p>{error}</p><button className="mt-2 text-primary underline" onClick={() => fetchAnalytics(orgId, true)}>Retry</button>
    </div>
    if (loadedOrgId !== orgId || !analytics.periodStart) return <AnalyticsSkeleton />

    const moodCounts = analytics.moodCounts || {
        happy: 0,
        excited: 0,
        neutral: 0,
        sad: 0,
        stressed: 0,
    }

    const moodDistribution = MOOD_ORDER.map(mood => ({
        mood,
        name: mood.charAt(0).toUpperCase() + mood.slice(1),
        value: moodCounts[mood],
        color: MOOD_COLORS[mood],
        share: analytics.totalLogs ? Math.round(moodCounts[mood] * 100 / analytics.totalLogs) : 0,
    }))
    const distributionSegments = createMoodDistributionSegments(moodDistribution, analytics.totalLogs)
    const leadingMoodCount = Math.max(...moodDistribution.map(item => item.value))
    const leadingMoods = moodDistribution.filter(item => item.value === leadingMoodCount && item.value > 0)

    const gaugeValue = analytics.orgTemperature
    const participationRate = analytics.activeMembers > 0
        ? Math.round(analytics.participants * 100 / analytics.activeMembers)
        : null


    const trend = aggregateTrend(analytics.detailedSeries, analytics.periodDays)
    const trendUnit = trend.granularity === "day" ? "daily" : trend.granularity === "week" ? "weekly" : "monthly"
    const dailyMoodByDate = new Map(analytics.detailedSeries.map(item => [item.dateKey, item]))
    const temperaturePlotStartX = 54
    const temperaturePlotWidth = 320 - temperaturePlotStartX
    const temperaturePoints = trend.granularity === "day"
        ? Array.from({ length: analytics.periodDays }, (_, index) => {
            const date = new Date(`${analytics.periodStart.slice(0, 10)}T00:00:00Z`)
            date.setUTCDate(date.getUTCDate() + index)
            const dateKey = date.toISOString().slice(0, 10)
            const x = analytics.periodDays <= 1
                ? temperaturePlotStartX
                : temperaturePlotStartX + index * temperaturePlotWidth / (analytics.periodDays - 1)
            let total = 0
            let positive = 0
            for (let daysAgo = 0; daysAgo < Math.min(index + 1, 7); daysAgo++) {
                const windowDate = new Date(date)
                windowDate.setUTCDate(windowDate.getUTCDate() - daysAgo)
                const item = dailyMoodByDate.get(windowDate.toISOString().slice(0, 10))
                if (!item) continue
                total += item.total
                positive += item.happy + item.excited
            }
            return {
                x,
                y: total > 0 ? 160 - positive / total * 160 : null,
                reliable: total >= 8,
            }
        })
        : trend.data.map((bucket, index) => ({
            x: trend.data.length <= 1
                ? temperaturePlotStartX
                : temperaturePlotStartX + index * temperaturePlotWidth / (trend.data.length - 1),
            y: bucket.total > 0 ? 160 - ((bucket.happy + bucket.excited) / bucket.total) * 160 : null,
            reliable: bucket.total >= (trend.granularity === "week" ? 4 : 8),
        }))
    const temperatureAreaPath = createWaveAreaPath(temperaturePoints)
    const temperatureWavePath = createWavePath(temperaturePoints)
    const reliableWavePath = createWavePath(temperaturePoints.map(point => ({ ...point, y: point.reliable ? point.y : null })))
    const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: analytics.timezone })
    const weekdayRange = `${dateFormat.format(new Date(analytics.weekdayPeriodStart))} – ${dateFormat.format(new Date(new Date(analytics.weekdayPeriodEnd).getTime() - 1))}`


    //
    // --- Render ---
    //
    return (
        <div className="analytics-page mobile-page-content min-w-0 space-y-4" aria-busy={loading}>
            {loading && <p role="status" className="text-xs text-muted-foreground">Updating analytics…</p>}
            {error && <p role="alert" className="text-sm text-muted-foreground">{error}. Showing the last loaded report. <button className="text-primary underline" onClick={() => fetchAnalytics(orgId, true)}>Retry</button></p>}


            {/* Page heading follows the dashboard title hierarchy. */}
            <header className="mobile-page-header flex flex-wrap items-start justify-between gap-3 pb-1 sm:items-end sm:gap-4 sm:pb-2">
                <div>
                    <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-3xl"><span className="md:hidden">Analytics</span><span className="hidden md:inline">Team mood</span></h1>
                </div>
                <div className="md:hidden"><AnalyticsRangePicker orgId={orgId} /></div>
            </header>

            <section aria-label="Team overview" className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1.15fr)_repeat(2,minmax(0,1fr))]">
                <article aria-label={analytics.totalLogs ? `Team Temperature: ${gaugeValue ?? 0}%. Generally positive mood.` : "Team Temperature: no check-ins in this period"} className="relative col-span-2 min-h-36 min-w-0 overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5 lg:col-span-1">
                    {temperatureWavePath && <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-primary" viewBox="0 0 320 160" preserveAspectRatio="none">
                        <path d={`M ${temperaturePlotStartX} 160 H 320`} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                        {temperatureAreaPath && <path d={temperatureAreaPath} fill="currentColor" fillOpacity="0.03" />}
                        <path d={temperatureWavePath} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" strokeLinecap="round" />
                        <path d={reliableWavePath} fill="none" stroke="currentColor" strokeOpacity="0.42" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>}
                    <div className="relative z-10">
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-5 text-foreground">Team Temperature</p>
                            <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-3xl">
                                {analytics.totalLogs ? `${gaugeValue ?? 0}%` : "—"}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-foreground sm:text-sm">{analytics.totalLogs ? "Generally positive mood" : "No check-ins in this period."}</p>
                        </div>
                    </div>
                    {temperatureWavePath && <span className="sr-only" role="img" aria-label={trend.granularity === "day"
                        ? "Team temperature uses a rolling window of up to seven days, plotted daily. Low-volume windows are muted; windows without check-ins are omitted."
                        : `${trendUnit} team temperature trend. Periods with fewer than ${trend.granularity === "week" ? 4 : 8} check-ins are omitted.`} />}
                </article>

                <article className="min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-5">
                    <p className="text-sm font-medium leading-5 text-foreground">Participation</p>
                    <p className="mt-1 text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
                        {analytics.activeMembers ? `${analytics.participants}/${analytics.activeMembers}` : "—"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-foreground sm:text-sm">
                        {participationRate === null ? "No active members" : `${participationRate}% of active members`}
                    </p>
                </article>

                <article className="min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-5">
                    <p className="text-sm font-medium leading-5 text-foreground">Most reported mood</p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                        {leadingMoods.length > 0 && <MoodIcon mood={(leadingMoods.length === 1 ? leadingMoods[0].mood : "neutral") as MoodName} className="size-6 shrink-0" variant="mobile" />}
                        <p className="truncate text-2xl font-semibold leading-none tracking-tight text-foreground sm:text-3xl">
                            {leadingMoods.length === 0 ? "—" : leadingMoods.length === 1 ? leadingMoods[0].name : "Tied"}
                        </p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-foreground sm:text-sm">
                        {leadingMoods.length === 0
                            ? "No check-ins in this period."
                            : leadingMoods.length === 1
                                ? `${leadingMoods[0].value} of ${analytics.totalLogs} check-ins · ${leadingMoods[0].share}%`
                                : `${leadingMoods.map(item => item.name).join(" and ")} · ${leadingMoodCount} each`}
                    </p>
                </article>

            </section>

            <MoodHeatmap orgId={orgId} timezone={analytics.timezone} moods={analytics.heatmap} days={analytics.heatmapDays} year={analytics.year} asOfDate={analytics.heatmapAsOfDate} latestYear={Number(analytics.asOfDate.slice(0, 4))} onYearChange={year => fetchAnalytics(orgId, true, { ...selectedRange, year })} />

            <ChartCard title="Mood distribution" contentClassName="h-auto">
                    {!analytics.totalLogs ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No check-ins in this period.</p> : (
                        <div className="grid min-w-0 grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
                            <div className="relative mx-auto aspect-[16/9] w-full max-w-[22rem]" role="img" aria-label={`Mood distribution across ${analytics.totalLogs} check-ins`}>
                                <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet">
                                    {distributionSegments.map(segment => (
                                        <path key={segment.mood} d={segment.path} fill="none" stroke={segment.color} strokeWidth="24" strokeLinecap="round">
                                            <title>{segment.name}: {segment.value} check-ins, {segment.share}%</title>
                                        </path>
                                    ))}
                                </svg>
                                <div className="pointer-events-none absolute inset-x-0 top-[64%] flex -translate-y-1/2 flex-col items-center justify-center gap-0.5">
                                    <span className="text-2xl font-semibold leading-none tabular-nums">{analytics.totalLogs}</span>
                                    <span className="text-xs text-muted-foreground">{analytics.totalLogs === 1 ? "check-in" : "check-ins"}</span>
                                </div>
                            </div>
                            <ul aria-label="Mood distribution details" className="min-w-0 divide-y divide-border/70">
                                {moodDistribution.map(item => (
                                    <li key={item.mood} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 py-2" aria-label={`${item.name}: ${item.value} check-ins`}>
                                        <MoodIcon mood={item.mood as MoodName} className="size-7 shrink-0" variant="mobile" />
                                        <span className="min-w-0 truncate text-sm font-medium">{item.name}</span>
                                        <span className="text-xs text-muted-foreground tabular-nums">{item.value} {item.value === 1 ? "check-in" : "check-ins"}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
            </ChartCard>

            <section aria-labelledby="mood-trends-heading" className="min-w-0 space-y-3">
                <h2 id="mood-trends-heading" className="text-lg font-semibold leading-6">Mood trends</h2>
                <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                <ChartCard
                    title={`${trendUnit.charAt(0).toUpperCase() + trendUnit.slice(1)} check-ins by mood`}
                    cardClassName="pb-3"
                    action={<ul aria-label="Mood legend" className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                        {(Object.keys(MOOD_COLORS) as MoodType[]).map(mood => <li key={mood} className="flex items-center gap-1.5 capitalize"><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: MOOD_COLORS[mood] }} />{mood}</li>)}
                    </ul>}
                    contentClassName="h-60 sm:h-[23rem]"
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

                <ChartCard title={`${trendUnit.charAt(0).toUpperCase() + trendUnit.slice(1)} intensity`} contentClassName="h-60 sm:h-[23rem]">
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
                </div>
            </section>

            <ChartCard title="Weekday patterns" contentClassName="h-auto">
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
        </div>
    )
}
