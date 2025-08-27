// app/(admin)/[orgId]/analytics/MoodAnalytics.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    ReferenceLine,
    Legend,
} from "recharts";
import { Flame, Snowflake, Activity, Users, BarChart as BarIcon } from "lucide-react";
import KpiCard from "./components/analytics/KpiCard";
import ChartCard from "./components/analytics/ChartCard";
import { useMoodStore } from "@/app/stores/useMoodStore";

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
const ASH = "#9ca3af";

type MoodType = "happy" | "neutral" | "sad" | "stressed" | "excited";

const MOOD_COLORS: Record<MoodType, string> = {
    happy: FIRE.glow,
    excited: FIRE.ember,
    neutral: ASH,
    sad: ICE.ice,
    stressed: ICE.blue,
};

const RANGE_OPTIONS = [7, 14, 30] as const;

export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { moods, fetchMoods } = useMoodStore();
    const [rangeDays, setRangeDays] = useState<number>(14);
    const [loadingRange, setLoadingRange] = useState(false);

    // load moods for selected range when orgId or rangeDays change
    useEffect(() => {
        if (!orgId) return;
        let mounted = true;
        (async () => {
            setLoadingRange(true);
            try {
                await fetchMoods(orgId, rangeDays);
            } catch (e) {
                // swallow, store handles errors
            } finally {
                if (mounted) setLoadingRange(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [orgId, rangeDays, fetchMoods]);

    // total logs in current store (should be already filtered by fetch)
    const totalLogs = moods.length;

    // counts per mood
    const moodCounts = useMemo(() => {
        const counts: Record<MoodType, number> = {
            happy: 0,
            neutral: 0,
            sad: 0,
            stressed: 0,
            excited: 0,
        };
        moods.forEach((m) => {
            const k = (m.mood as MoodType) || "neutral";
            counts[k] = (counts[k] || 0) + 1;
        });
        return counts;
    }, [moods]);

    // average rank (1-5 scale assumed)
    const avgRank = useMemo(() => {
        if (!totalLogs) return 0;
        const avg =
            moods.reduce((sum, m) => sum + (Number(m.rank) || 0), 0) / totalLogs;
        return Number(avg.toFixed(2));
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

    // sliding series by day for rangeDays
    const series = useMemo(() => {
        const days = rangeDays;
        return Array.from({ length: days }).map((_, idx) => {
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

            const pos = dayLogs.filter((m) => m.mood === "happy" || m.mood === "excited").length;
            const neg = dayLogs.filter((m) => m.mood === "sad" || m.mood === "stressed").length;

            return {
                iso: d.toISOString(),
                day: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
                avg: Number(dayAvg.toFixed(2)),
                positive: pos,
                negative: neg,
                total: dayLogs.length,
            };
        });
    }, [moods, rangeDays]);

    // volatility (std dev) across avg values
    const volatility = useMemo(() => {
        const values = series.map((s) => s.avg).filter((v) => v > 0);
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
            values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
            (values.length - 1);
        return Number(Math.sqrt(variance).toFixed(2));
    }, [series]);

    // gauge and pie
    const pieData = (Object.keys(moodCounts) as MoodType[])
        .map((k) => ({ name: k, value: moodCounts[k], color: MOOD_COLORS[k] }))
        .filter((d) => d.value > 0);

    const gaugeValue = useMemo(() => Math.round((avgRank / 5) * 100), [avgRank]);
    const gaugeData = [{ name: "Org Temperature", value: gaugeValue }];

    // engagement per day series for bars
    const engagementData = series.map((s) => ({ day: s.day, logs: s.total, positive: s.positive, negative: s.negative }));

    // week-over-week (compare last half of series to first half)
    const weekComparison = useMemo(() => {
        const half = Math.floor(series.length / 2);
        const first = series.slice(0, half);
        const second = series.slice(half);
        const avgFirst = first.length ? first.reduce((s, d) => s + d.avg, 0) / first.length : 0;
        const avgSecond = second.length ? second.reduce((s, d) => s + d.avg, 0) / second.length : 0;
        const pct = avgFirst ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
        return {
            avgFirst: Number(avgFirst.toFixed(2)),
            avgSecond: Number(avgSecond.toFixed(2)),
            pctChange: Number(pct.toFixed(1)),
        };
    }, [series]);

    // best/worst day
    const bestDay = useMemo(() => {
        return series.reduce((best, d) => (d.avg > (best?.avg ?? -Infinity) ? d : best), null as any);
    }, [series]);

    const worstDay = useMemo(() => {
        return series.reduce((worst, d) => (d.avg < (worst?.avg ?? Infinity) ? d : worst), null as any);
    }, [series]);

    // KPI values
    const avgLogsPerUser = totalLogs && uniqueParticipants ? (totalLogs / uniqueParticipants) : 0;

    // small helper for time range buttons
    const RangeSelector = () => (
        <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-600 mr-2">Range</span>
            {RANGE_OPTIONS.map((d) => (
                <button
                    key={d}
                    onClick={() => setRangeDays(d)}
                    className={`px-3 py-1 text-sm rounded-md border ${rangeDays === d ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-700 border-slate-200"
                        }`}
                >
                    {d}d
                </button>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                    <Snowflake className="w-5 h-5 text-sky-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Mood Analytics — Organization Climate</h3>
                    <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex items-center gap-4">
                    <RangeSelector />
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Org Temperature"
                    value={`${avgRank.toFixed(2)} / 5`}
                    sub={`${posPct}% positive · ${negPct}% negative`}
                    glow="from-slate-100 to-slate-50"
                    icon={<Activity className="w-5 h-5 text-slate-700" />}
                />

                <KpiCard
                    title="Total Mood Logs"
                    value={totalLogs}
                    sub={`Participants: ${uniqueParticipants} · Logs/user: ${avgLogsPerUser ? avgLogsPerUser.toFixed(1) : 0}`}
                    glow="from-slate-100 to-slate-50"
                    icon={<Users className="w-5 h-5 text-slate-700" />}
                />

                <KpiCard
                    title="Volatility (σ)"
                    value={volatility}
                    sub={volatility <= 0.4 ? "Stable" : volatility <= 0.8 ? "Shifting" : "Volatile"}
                    glow="from-slate-100 to-slate-50"
                    icon={<BarIcon className="w-5 h-5 text-slate-700" />}
                />

                <KpiCard
                    title="Week Δ (avg)"
                    value={`${weekComparison.pctChange}%`}
                    sub={`From ${weekComparison.avgFirst} → ${weekComparison.avgSecond}`}
                    glow="from-slate-100 to-slate-50"
                    icon={<Flame className="w-5 h-5 text-orange-600" />}
                />
            </div>

            {/* Charts row (gauge + distribution) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Org Temperature (Gauge)">
                    <div className="w-full h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={20} data={gaugeData} startAngle={180} endAngle={0}>
                                <defs>
                                    <linearGradient id="gaugeFireIce" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor={ICE.blue} />
                                        <stop offset="100%" stopColor={FIRE.ember} />
                                    </linearGradient>
                                </defs>
                                <RadialBar background dataKey="value" cornerRadius={12} fill="url(#gaugeFireIce)" />
                                <text x="50%" y="55%" textAnchor="middle" fontSize={20} fontWeight={700} fill="#111827">
                                    {gaugeValue}%
                                </text>
                                <text x="50%" y="72%" textAnchor="middle" fontSize={11} fill="#6b7280">
                                    Avg Mood {avgRank.toFixed(2)} / 5
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard title="Mood Distribution">
                    <div className="w-full h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={96} paddingAngle={4} label={(d) => `${d.name} (${d.value})`}>
                                    {pieData.map((d, i) => (
                                        <Cell key={i} fill={d.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Trends and engagement */}
            <ChartCard title={`Mood Trend (${rangeDays} days)`}>
                <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                            <XAxis dataKey="day" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" domain={[0, 5]} />
                            <Tooltip />
                            <ReferenceLine y={3} stroke="#e5e7eb" strokeDasharray="3 3" label={{ value: "Neutral", position: "insideTop", fill: "#6b7280" }} />
                            <Line type="monotone" dataKey="positive" stroke={FIRE.ember} strokeWidth={2} dot={{ r: 2 }} name="Positive" />
                            <Line type="monotone" dataKey="negative" stroke={ICE.blue} strokeWidth={2} dot={{ r: 2 }} name="Negative" />
                            <Line type="monotone" dataKey="avg" stroke="#374151" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Avg Rank" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            <ChartCard title="Engagement (Positive vs Negative) - Daily Check-ins">
                <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementData}>
                            <XAxis dataKey="day" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="positive" stackId="a" fill={FIRE.ember} name="Positive" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="negative" stackId="a" fill={ICE.blue} name="Negative" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Narrative insights */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <CardInsight title="Top Insight">
                    {bestDay && worstDay ? (
                        <>
                            <p className="text-sm text-slate-700">
                                Over the last {rangeDays} days, the average mood is <strong>{avgRank.toFixed(2)}</strong>. This is a <strong>{weekComparison.pctChange}%</strong> change vs earlier half.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-slate-600">Not enough data to generate insights.</p>
                    )}
                </CardInsight>

                <CardInsight title="Best Day">
                    {bestDay ? (
                        <p className="text-sm text-slate-700">
                            {bestDay.day} — Avg {bestDay.avg.toFixed(2)} · {bestDay.total} check-ins
                        </p>
                    ) : (
                        <p className="text-sm text-slate-600">No data</p>
                    )}
                </CardInsight>

                <CardInsight title="Worst Day">
                    {worstDay ? (
                        <p className="text-sm text-slate-700">
                            {worstDay.day} — Avg {worstDay.avg.toFixed(2)} · {worstDay.total} check-ins
                        </p>
                    ) : (
                        <p className="text-sm text-slate-600">No data</p>
                    )}
                </CardInsight>
            </div>
        </div>
    );
}

/* Small presentational helper component used above */
function CardInsight({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-slate-200 rounded-lg bg-white p-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-800">{title}</h4>
            </div>
            <div className="mt-3 text-sm text-slate-600">{children}</div>
        </div>
    );
}
