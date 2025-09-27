"use client"

import { useEffect, useMemo } from "react"
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
    const { moods } = useMoodStore()
    const { analytics, fetchAnalytics } = useMoodAnalyticsStore()

    // Fetch data on mount/org change
    useEffect(() => {
        fetchAnalytics(orgId);
    }, [orgId, fetchAnalytics])

    //
    // --- Derived Data ---
    //
    const totalLogs = moods.length

    const moodCounts = analytics.moodCounts || {
        happy: 0,
        excited: 0,
        neutral: 0,
        sad: 0,
        stressed: 0,
    }

    const avgRank = useMemo(() => {
        if (!totalLogs) return 0
        const sum = moods.reduce((s, m) => s + (Number(m.rank) || 0), 0)
        return Number((sum / totalLogs).toFixed(2))
    }, [moods, totalLogs])

    // Pie Data
    const pieData = (Object.entries(moodCounts) as [MoodType, number][])
        .map(([mood, value]) => ({
            name: mood,
            value,
            color: MOOD_COLORS[mood],
        }))
        .filter((d) => d.value > 0)

    // Gauge Data (Org Temperature)
    const gaugeValue = useMemo(
        () => Math.round((avgRank / 5) * 100),
        [avgRank]
    )
    const gaugeData = [{ name: "Org Temperature", value: gaugeValue }]



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
                    sub={`${analytics.posPct}% 🔥 positive · ${analytics.negPct}% ❄️ negative`}
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
                                {gaugeValue}%
                            </text>
                            <text
                                x="50%"
                                y="70%"
                                textAnchor="middle"
                                fontSize={12}
                                fill="#6b7280"
                            >
                                Avg Mood {avgRank.toFixed(2)} / 5
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
                            dataKey="positive"
                            stroke={FIRE.ember}
                            strokeWidth={3}
                            name="🔥 Positive"
                        />
                        <Line
                            type="monotone"
                            dataKey="negative"
                            stroke={ICE.blue}
                            strokeWidth={3}
                            name="❄️ Negative"
                        />
                        <Line
                            type="monotone"
                            dataKey="avg"
                            stroke="#374151"
                            strokeDasharray="4 4"
                            name="Avg Rank"
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
