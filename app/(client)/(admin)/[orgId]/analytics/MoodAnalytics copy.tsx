"use client";

import { useEffect, useMemo } from "react";
import { useMoodStore } from "@/app/stores/useMoodStore";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/app/components/ui/card";
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

// --- Theming (Ice ❄️ & Fire 🔥) ---
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

/** Map moods to fire/ice palette */
const MOOD_COLORS: Record<MoodType, string> = {
    happy: FIRE.glow,     // 🔥 warm
    excited: FIRE.ember,  // 🔥 stronger
    neutral: ASH,         // ash/neutral
    sad: ICE.ice,         // ❄️ cold
    stressed: ICE.blue,   // ❄️ deeper cold
};

export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { moods, fetchMoods, loading } = useMoodStore();

    useEffect(() => {
        fetchMoods(orgId);
    }, [orgId, fetchMoods]);

    // ---------- Aggregations ----------
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
        const v =
            moods.reduce((sum, m) => sum + (Number(m.rank) || 0), 0) / totalLogs;
        return Number(v.toFixed(2));
    }, [moods, totalLogs]);

    // positive = happy + excited, negative = sad + stressed
    const posCount = moodCounts.happy + moodCounts.excited;
    const negCount = moodCounts.sad + moodCounts.stressed;
    const posPct = totalLogs ? Math.round((posCount / totalLogs) * 100) : 0;
    const negPct = totalLogs ? Math.round((negCount / totalLogs) * 100) : 0;

    const uniqueParticipants = useMemo(() => {
        const s = new Set<string>();
        moods.forEach((m) => s.add(String(m.user)));
        return s.size;
    }, [moods]);

    // ---------- Time Series (last 14 days) ----------
    const days = 14;
    const series = useMemo(() => {
        const arr = Array.from({ length: days }).map((_, idx) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (days - 1 - idx));
            const key = d.toDateString();

            const dayLogs = moods.filter(
                (m) => new Date(m.date).toDateString() === key
            );
            const dayAvg = dayLogs.length
                ? dayLogs.reduce((s, m) => s + (Number(m.rank) || 0), 0) / dayLogs.length
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
        return arr;
    }, [moods]);

    // ---------- Volatility (std dev of daily avg) ----------
    const volatility = useMemo(() => {
        const values = series.map((s) => s.avg).filter((v) => v > 0);
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
            values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
            (values.length - 1);
        return Number(Math.sqrt(variance).toFixed(2));
    }, [series]);

    // ---------- Distribution (donut) ----------
    const pieData = (["happy", "excited", "neutral", "sad", "stressed"] as MoodType[])
        .map((k) => ({ name: k, value: moodCounts[k], color: MOOD_COLORS[k] }))
        .filter((d) => d.value > 0);

    // ---------- Temperature Gauge (Radial) ----------
    // Map 1..5 to 0..100
    const gaugeValue = useMemo(() => Math.round((avgRank / 5) * 100), [avgRank]);
    const gaugeData = [{ name: "Org Temperature", value: gaugeValue }];

    // ---------- Engagement (last 14 days check-ins per day) ----------
    const engagementData = series.map((s) => ({ day: s.day, logs: s.total }));

    // ---------- Notes: Top keywords (very light, anonymous) ----------
    const keywords = useMemo(() => {
        const stop = new Set([
            "the", "a", "an", "and", "is", "it", "to", "of", "for", "in", "on", "at",
            "i", "we", "you", "they", "with", "this", "that", "be", "are", "was", "were",
        ]);
        const freq: Record<string, number> = {};
        moods.forEach((m) => {
            if (!m.note) return;
            m.note
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter((w) => w && !stop.has(w) && w.length > 2)
                .forEach((w) => (freq[w] = (freq[w] || 0) + 1));
        });
        const entries = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
        return entries;
    }, [moods]);

    return (
        <div className="space-y-6">
            {/* Theme banner */}
            <div className="rounded-2xl p-5 bg-gradient-to-r from-sky-950/70 via-slate-900 to-orange-950/70 border border-slate-800 shadow-inner">
                <div className="flex items-center gap-3">
                    <Snowflake className="w-5 h-5 text-sky-300" />
                    <h3 className="text-sm font-medium tracking-wide text-slate-200">
                        Ice & Fire Analytics — Organization Climate
                    </h3>
                    <Flame className="w-5 h-5 text-orange-300 ml-auto" />
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KPI
                    title="Org Temperature"
                    value={`${avgRank.toFixed(2)} / 5`}
                    sub={`${posPct}% 🔥 positive · ${negPct}% ❄️ negative`}
                    glow="from-orange-500/20 to-sky-500/20"
                    icon={<Activity className="w-5 h-5" />}
                />
                <KPI
                    title="Total Mood Logs"
                    value={totalLogs}
                    sub={`Participants: ${uniqueParticipants}`}
                    glow="from-slate-500/20 to-slate-300/10"
                    icon={<Users className="w-5 h-5" />}
                />
                <KPI
                    title="Volatility (σ)"
                    value={volatility}
                    sub={volatility <= 0.4 ? "Stable ❄️" : volatility <= 0.8 ? "Shifting" : "Volatile 🔥"}
                    glow="from-sky-500/20 to-orange-500/20"
                    icon={<Snowflake className="w-5 h-5" />}
                />
                <KPI
                    title="Positive vs Negative"
                    value={`${posCount}/${negCount}`}
                    sub="happy+excited / sad+stressed"
                    glow="from-orange-500/20 to-sky-500/20"
                    icon={<Flame className="w-5 h-5" />}
                />
            </div>

            {/* Temperature Gauge + Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="rounded-2xl border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-slate-200">Org Temperature (Gauge)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
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
                                    {/* Center label */}
                                    <text
                                        x="50%"
                                        y="55%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-slate-200"
                                        fontSize={28}
                                        fontWeight={700}
                                    >
                                        {gaugeValue}%
                                    </text>
                                    <text
                                        x="50%"
                                        y="68%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-slate-400"
                                        fontSize={12}
                                    >
                                        Avg Mood Rank {avgRank.toFixed(2)} / 5
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-slate-200">Mood Distribution (Fire & Ice)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
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
                                    <Tooltip
                                        contentStyle={{
                                            background: "#0b1220",
                                            border: "1px solid #1f2937",
                                            borderRadius: 12,
                                            color: "#e5e7eb",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Positive vs Negative trend (dual line) */}
            <Card className="rounded-2xl border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-200">Mood Heat/Cool Trend (14 days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={series}>
                                <defs>
                                    <linearGradient id="fireLine" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={FIRE.ember} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={FIRE.red} stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="iceLine" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={ICE.ice} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={ICE.blue} stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" stroke="#64748b" />
                                <YAxis yAxisId="left" stroke="#64748b" />
                                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{
                                        background: "#0b1220",
                                        border: "1px solid #1f2937",
                                        borderRadius: 12,
                                        color: "#e5e7eb",
                                    }}
                                />
                                {/* Positive = fire, Negative = ice (counts) */}
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="positive"
                                    stroke="url(#fireLine)"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 6 }}
                                    name="🔥 Positive (happy+excited)"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="negative"
                                    stroke="url(#iceLine)"
                                    strokeWidth={3}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 6 }}
                                    name="❄️ Negative (sad+stressed)"
                                />
                                {/* Avg mood (1–5) on left axis */}
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="avg"
                                    stroke="#e5e7eb"
                                    strokeDasharray="4 4"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Avg Rank"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Engagement (daily logs) */}
            <Card className="rounded-2xl border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-200">Engagement (Daily Check-ins)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={engagementData}>
                                <defs>
                                    <linearGradient id="engagement" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={FIRE.glow} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={ICE.frost} stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{
                                        background: "#0b1220",
                                        border: "1px solid #1f2937",
                                        borderRadius: 12,
                                        color: "#e5e7eb",
                                    }}
                                />
                                <Bar dataKey="logs" fill="url(#engagement)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Notes insights */}
            <Card className="rounded-2xl border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-200">Anonymous Notes — Fire & Ice Cloud</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {keywords.length === 0 ? (
                        <p className="text-slate-400 text-sm">
                            No notes yet. When users add notes to mood logs, we’ll extract trending keywords here.
                        </p>
                    ) : (
                        keywords.map(({ word, count }, i) => {
                            // Warm for positive-leaning words; cool for negative-leaning heuristics
                            const warmish = /win|good|great|clear|help|support|ship|done|celebrate|excite|happy/i.test(
                                word
                            );
                            const chip =
                                warmish
                                    ? "bg-orange-500/15 text-orange-200 border border-orange-400/30"
                                    : "bg-sky-500/15 text-sky-200 border border-sky-400/30";
                            const scale = Math.min(1 + count * 0.06, 1.4);
                            return (
                                <span
                                    key={word + i}
                                    className={`px-3 py-1 rounded-full ${chip}`}
                                    style={{ transform: `scale(${scale})` }}
                                    title={`Count: ${count}`}
                                >
                                    {word}
                                </span>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* ---------------- Reusable KPI ---------------- */
function KPI({
    title,
    value,
    sub,
    glow = "from-slate-500/10 to-slate-400/10",
    icon,
}: {
    title: string;
    value: string | number;
    sub?: string;
    glow?: string;
    icon?: React.ReactNode;
}) {
    return (
        <Card className="rounded-2xl border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 shadow-sm hover:shadow-md transition">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
                        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
                    </div>
                    <div
                        className={`ml-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${glow}`}
                    >
                        <div className="text-slate-200 opacity-90">{icon}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
