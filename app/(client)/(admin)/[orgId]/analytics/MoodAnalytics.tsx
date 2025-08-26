"use client";

import { useEffect, useMemo } from "react";
import { useMoodStore } from "@/app/stores/useMoodStore";

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
} from "recharts";
import { Flame, Snowflake, Activity, Users } from "lucide-react";
import KpiCard from "./components/analytics/KpiCard";
import ChartCard from "./components/analytics/ChartCard";

const FIRE = {
    red: "#ef4444",
    ember: "#f97316",
    glow: "#fb923c",
};
const ICE = {
    blue: "#3b82f6",
    ice: "#60a5fa",
    frost: "#93c5fd",
};
const ASH = "#a3a3a3";

type MoodType = "happy" | "neutral" | "sad" | "stressed" | "excited";

const MOOD_COLORS: Record<MoodType, string> = {
    happy: FIRE.glow,
    excited: FIRE.ember,
    neutral: ASH,
    sad: ICE.ice,
    stressed: ICE.blue,
};

export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { moods, fetchMoods } = useMoodStore();

    useEffect(() => {
        fetchMoods(orgId);
    }, [orgId, fetchMoods]);

    const totalLogs = moods.length;

    const moodCounts = useMemo(() => {
        const counts: Record<MoodType, number> = {
            happy: 0,
            neutral: 0,
            sad: 0,
            stressed: 0,
            excited: 0,
        };
        moods.forEach((m) => {
            counts[m.mood as MoodType] = (counts[m.mood as MoodType] || 0) + 1;
        });
        return counts;
    }, [moods]);

    const avgRank = useMemo(() => {
        if (!totalLogs) return 0;
        return Number(
            (
                moods.reduce((sum, m) => sum + (Number(m.rank) || 0), 0) /
                totalLogs
            ).toFixed(2)
        );
    }, [moods, totalLogs]);

    const posCount = moodCounts.happy + moodCounts.excited;
    const negCount = moodCounts.sad + moodCounts.stressed;
    const posPct = totalLogs ? Math.round((posCount / totalLogs) * 100) : 0;
    const negPct = totalLogs ? Math.round((negCount / totalLogs) * 100) : 0;

    const uniqueParticipants = useMemo(() => {
        const s = new Set<string>();
        moods.forEach((m) => s.add(String(m.user)));
        return s.size;
    }, [moods]);

    const days = 14;
    const series = useMemo(() => {
        return Array.from({ length: days }).map((_, idx) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (days - 1 - idx));
            const key = d.toDateString();

            const dayLogs = moods.filter(
                (m) => new Date(m.date).toDateString() === key
            );
            const dayAvg = dayLogs.length
                ? dayLogs.reduce((s, m) => s + (Number(m.rank) || 0), 0) /
                dayLogs.length
                : 0;

            const pos = dayLogs.filter(
                (m) => m.mood === "happy" || m.mood === "excited"
            ).length;
            const neg = dayLogs.filter(
                (m) => m.mood === "sad" || m.mood === "stressed"
            ).length;

            return {
                day: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
                avg: Number(dayAvg.toFixed(2)),
                positive: pos,
                negative: neg,
                total: dayLogs.length,
            };
        });
    }, [moods]);

    const volatility = useMemo(() => {
        const values = series.map((s) => s.avg).filter((v) => v > 0);
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
            values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
            (values.length - 1);
        return Number(Math.sqrt(variance).toFixed(2));
    }, [series]);

    const pieData = (Object.keys(moodCounts) as MoodType[])
        .map((k) => ({ name: k, value: moodCounts[k], color: MOOD_COLORS[k] }))
        .filter((d) => d.value > 0);

    const gaugeValue = useMemo(() => Math.round((avgRank / 5) * 100), [avgRank]);
    const gaugeData = [{ name: "Org Temperature", value: gaugeValue }];

    const engagementData = series.map((s) => ({ day: s.day, logs: s.total }));

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-5 bg-gradient-to-r from-sky-100 via-slate-50 to-orange-100 border border-slate-200">
                <div className="flex items-center gap-3">
                    <Snowflake className="w-5 h-5 text-sky-500" />
                    <h3 className="text-sm font-medium tracking-wide text-slate-600">
                        Ice & Fire Analytics — Organization Climate
                    </h3>
                    <Flame className="w-5 h-5 text-orange-500 ml-auto" />
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <KpiCard
                    title="Org Temperature"
                    value={`${avgRank.toFixed(2)} / 5`}
                    sub={`${posPct}% 🔥 positive · ${negPct}% ❄️ negative`}
                    glow="from-orange-100 to-sky-100"
                    icon={<Activity className="w-5 h-5 text-orange-600" />}
                />

                <KpiCard
                    title="Total Mood Logs"
                    value={totalLogs}
                    sub={`Participants: ${uniqueParticipants}`}
                    glow="from-slate-100 to-slate-50"
                    icon={<Users className="w-5 h-5 text-slate-600" />}
                />
                <KpiCard
                    title="Volatility (σ)"
                    value={volatility}
                    sub={volatility <= 0.4 ? "Stable ❄️" : volatility <= 0.8 ? "Shifting" : "Volatile 🔥"}
                    glow="from-sky-100 to-orange-100"
                    icon={<Snowflake className="w-5 h-5 text-sky-600" />}
                />
                <KpiCard
                    title="Positive vs Negative"
                    value={`${posCount}/${negCount}`}
                    sub="happy+excited / sad+stressed"
                    glow="from-orange-100 to-sky-100"
                    icon={<Flame className="w-5 h-5 text-orange-600" />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                            <text x="50%" y="55%" textAnchor="middle" fontSize={24} fontWeight={600} fill="#374151">
                                {gaugeValue}%
                            </text>
                            <text x="50%" y="70%" textAnchor="middle" fontSize={12} fill="#6b7280">
                                Avg Mood {avgRank.toFixed(2)} / 5
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Mood Distribution (Fire & Ice)">
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

            <ChartCard title="Mood Heat/Cool Trend (14 days)">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
                        <Line type="monotone" dataKey="positive" stroke={FIRE.ember} strokeWidth={3} name="🔥 Positive" />
                        <Line type="monotone" dataKey="negative" stroke={ICE.blue} strokeWidth={3} name="❄️ Negative" />
                        <Line type="monotone" dataKey="avg" stroke="#374151" strokeDasharray="4 4" name="Avg Rank" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Engagement (Daily Check-ins)">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
                        <Bar dataKey="logs" fill="url(#engagement)" radius={[6, 6, 0, 0]} />
                        <defs>
                            <linearGradient id="engagement" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={FIRE.glow} />
                                <stop offset="100%" stopColor={ICE.frost} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}
