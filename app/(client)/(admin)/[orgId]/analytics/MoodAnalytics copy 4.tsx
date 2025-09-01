"use client"

import { useEffect } from "react"
import { useMoodStore } from "@/app/stores/useMoodStore"
import { useMoodAnalyticsStore } from "@/app/stores/useMoodAnalyticsStore"

import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
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
import MoodHeatmap from "./MoodHeatmap"

//
// --- Constants ---
//
const FIRE = { red: "#ef4444", ember: "#f97316", glow: "#fb923c" }
const ICE = { blue: "#3b82f6", ice: "#60a5fa", frost: "#93c5fd" }
const ASH = "#a3a3a3"

const MOOD_COLORS = {
    happy: FIRE.glow,
    excited: FIRE.ember,
    neutral: ASH,
    sad: ICE.ice,
    stressed: ICE.blue,
}

type MoodType = keyof typeof MOOD_COLORS

//
// --- Component ---
//
export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { moods, fetchAllMoods } = useMoodStore()
    const { analytics, fetchAnalytics, loading } = useMoodAnalyticsStore()

    // Fetch data on mount/org change
    useEffect(() => {
        fetchAllMoods(orgId)
        fetchAnalytics(orgId)
    }, [orgId, fetchAllMoods, fetchAnalytics])

    if (loading) {
        return <div className="p-6 text-slate-500">Loading analytics...</div>
    }

    // --- Prepare data from backend ---
    const pieData = (["happy", "excited", "neutral", "sad", "stressed"] as MoodType[])
        .map((mood) => ({
            name: mood,
            value: moods.filter((m) => m.mood === mood).length,
            color: MOOD_COLORS[mood],
        }))
        .filter((d) => d.value > 0)

    const gaugeData = [{ name: "Org Temperature", value: analytics.orgTemperature }]
    const engagementData = analytics.series?.map((s: any) => ({
        day: s.day,
        logs: s.logs,
    })) || []

    //
    // --- Render ---
    //
    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="rounded-xl p-4 bg-gradient-to-r from-sky-50 via-white to-orange-50 border border-slate-200">
                <div className="flex items-center gap-2">
                    <Snowflake className="w-5 h-5 text-sky-500" />
                    <h3 className="text-sm font-semibold tracking-wide text-slate-700">
                        Ice & Fire Analytics — Organizational Climate
                    </h3>
                    <Flame className="w-5 h-5 text-orange-500 ml-auto" />
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Org Temperature"
                    value={`${analytics.avgRank.toFixed(2)} / 5`}
                    sub={`${analytics.posPct} 🔥 positive · ${analytics.negPct} ❄️ negative`}
                    glow="from-orange-50 to-sky-50"
                    icon={<Activity className="w-5 h-5 text-orange-600" />}
                />

                <KpiCard
                    title="Total Mood Logs"
                    value={analytics.totalLogs}
                    sub={`Participants: ${analytics.participants}`}
                    glow="from-slate-50 to-slate-50"
                    icon={<Users className="w-5 h-5 text-slate-600" />}
                />

                <KpiCard
                    title="Volatility (σ)"
                    value={analytics.volatility}
                    sub={
                        analytics.volatility <= 0.4
                            ? "Stable ❄️"
                            : analytics.volatility <= 0.8
                                ? "Shifting"
                                : "Volatile 🔥"
                    }
                    glow="from-sky-50 to-orange-50"
                    icon={<Snowflake className="w-5 h-5 text-sky-600" />}
                />

                <KpiCard
                    title="Positive vs Negative"
                    value={`${analytics.posPct}/${analytics.negPct}`}
                    sub="happy+excited / sad+stressed"
                    glow="from-orange-50 to-sky-50"
                    icon={<Flame className="w-5 h-5 text-orange-600" />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Gauge */}
                <ChartCard title="Org Temperature (Gauge)">
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
                                fill="#374151"
                            >
                                {analytics.orgTemperature}%
                            </text>
                            <text
                                x="50%"
                                y="70%"
                                textAnchor="middle"
                                fontSize={12}
                                fill="#6b7280"
                            >
                                Avg Mood {analytics.avgRank.toFixed(2)} / 5
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Pie */}
                <ChartCard title="Mood Distribution">
                    <ResponsiveContainer width="100%" height="100%">
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
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Line Trend */}
            <ChartCard title="Mood Heat/Cool Trend (14 days)">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.detailedSeries}>
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="logs"
                            stroke="#374151"
                            strokeWidth={3}
                            name="Logs"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <MoodHeatmap moods={moods} />

            {/* Engagement */}
            <ChartCard title="Engagement (Daily Check-ins)">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
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
        </div>
    )
}
