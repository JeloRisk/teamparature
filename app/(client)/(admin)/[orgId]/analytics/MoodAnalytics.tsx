"use client"


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
// --- Component ---
//
export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { analytics, loading, error, orgId: loadedOrgId } = useMoodAnalyticsStore()
    if (loadedOrgId !== orgId || loading) return <p>Loading analytics…</p>
    if (error) return <p role="alert">{error}</p>

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



    const engagementData = analytics.detailedSeries?.map((s: { day: string; total: number }) => ({
        day: s.day,
        logs: s.total,
    })) || []


    //
    // --- Render ---
    //
    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="rounded-xl p-4 bg-gradient-to-r dark:bg-none from-sky-50 via-white to-orange-50 border border-border dark:border-border">
                <div className="flex items-center gap-2">
                    <Snowflake className="w-5 h-5 text-sky-500" />
                    <h3 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-muted-foreground">
                        Team mood · Last 14 days
                    </h3>
                    <Flame className="w-5 h-5 text-orange-500 ml-auto" />
                </div>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
                <p>{new Date(analytics.periodStart).toLocaleDateString(undefined, { timeZone: analytics.timezone })} – {new Date(new Date(analytics.periodEnd).getTime() - 1).toLocaleDateString(undefined, { timeZone: analytics.timezone })} · {analytics.timezone}</p>
                <p>Temperature is the share of check-ins marked Happy or Excited. The dashboard shows today; these totals cover 14 days. Intensity measures how strongly a feeling is experienced, from 1 to 5.</p>
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
                    title="Check-ins · 14 days"
                    value={analytics.totalLogs}
                    sub={`Participants: ${analytics.participants}`}
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


            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Gauge */}
                <ChartCard title="Team temperature · 14 days">
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
                <ChartCard title="Mood distribution · 14 days">
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

            {/* Line Trend */}
            <ChartCard title="Daily mood counts · 14 days">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.detailedSeries}>
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis allowDecimals={false} stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
                        <Line
                            type="monotone"
                            dataKey="positive"
                            stroke={FIRE.ember}
                            strokeWidth={3}
                            name="Happy + Excited"
                        />
                        <Line
                            type="monotone"
                            dataKey="negative"
                            stroke={ICE.blue}
                            strokeWidth={3}
                            name="Sad + Stressed"
                        />

                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>


            <ChartCard title="Daily intensity · 14 days">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.detailedSeries}>
                        <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="var(--muted-foreground)" />
                        <Tooltip contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)" }} />
                        <Line type="monotone" dataKey="avg" name="Average intensity (1–5)" connectNulls={false} stroke="var(--primary)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Engagement */}
            <ChartCard title="Engagement (Daily Check-ins)">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis allowDecimals={false} stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
                        <defs>
                            <linearGradient id="engagement" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={FIRE.glow} />
                                <stop offset="100%" stopColor={ICE.frost} />
                            </linearGradient>
                        </defs>
                        <Bar dataKey="logs" fill="url(#engagement)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
            <MoodHeatmap moods={analytics.heatmap} year={analytics.year} timezone={analytics.timezone} />
        </div>
    )
}
