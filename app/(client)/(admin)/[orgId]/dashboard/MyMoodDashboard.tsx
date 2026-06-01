"use client"

import { useMemo } from "react"
import {
    Flame,
    Activity,
    HeartHandshake,
    Sparkles,
    Smile,
    Meh,
    Frown,
    LineChart,
    Compass,
} from "lucide-react"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    Cell,
} from "recharts"

const moodConfig = {
    happy: { icon: Smile, color: "bg-[#00d26a]", colorHex: "#00d26a", bgLight: "bg-[#00d26a]/5", border: "border-[#00d26a]/10", text: "text-[#00a95c]", label: "Happy", greeting: "Radiant & Bright" },
    excited: { icon: Sparkles, color: "bg-[#ff2d8d]", colorHex: "#ff2d8d", bgLight: "bg-[#ff2d8d]/5", border: "border-[#ff2d8d]/10", text: "text-[#ff2d8d]", label: "Excited", greeting: "Full of Energy" },
    neutral: { icon: Meh, color: "bg-[#00c2ff]", colorHex: "#00c2ff", bgLight: "bg-[#00c2ff]/5", border: "border-[#00c2ff]/10", text: "text-[#00b8ff]", label: "Neutral", greeting: "Calm & Centered" },
    sad: { icon: Frown, color: "bg-[#7a5cff]", colorHex: "#7a5cff", bgLight: "bg-[#7a5cff]/5", border: "border-[#7a5cff]/10", text: "text-[#7a5cff]", label: "Sad", greeting: "Gentle & Reflective" },
    stressed: { icon: Flame, color: "bg-[#ffb800]", colorHex: "#ffb800", bgLight: "bg-[#ffb800]/5", border: "border-[#ffb800]/10", text: "text-[#ff9500]", label: "Stressed", greeting: "Taking it Step-by-Step" },
}

// FIX: Strong types defined to satisfy strict typescript-eslint rules
interface MoodBreakdown {
    happy?: number
    excited?: number
    neutral?: number
    sad?: number
    stressed?: number
}

interface WeeklyTrendItem {
    day: string
    mood: string
    rank: number
}

interface RecentCheckInItem {
    mood: string
    rank: number
    note?: string
}

interface PrepopulatedAnalytics {
    overview?: {
        dominantMood?: string
        emotionalScore?: number
        streak?: number
        stability?: number
    }
    weeklyTrend?: WeeklyTrendItem[]
    recentCheckIns?: RecentCheckInItem[]
    moodBreakdown?: MoodBreakdown
    weeklyStats?: {
        bestDay?: string
    }
}

interface MyMoodDashboardProps {
    prepopulatedAnalytics: PrepopulatedAnalytics | null | undefined
}

// Recharts specific payload type alignment
interface TooltipPayloadItem {
    payload: WeeklyTrendItem
}

export default function MyMoodDashboard({ prepopulatedAnalytics }: MyMoodDashboardProps) {
    
    console.log("RAW ANALYTICS PROP IN DASHBOARD:", prepopulatedAnalytics);
    
    const analytics = prepopulatedAnalytics || {}

    // Safe fallback structures
    const overview = analytics?.overview || { dominantMood: "happy", emotionalScore: 0, streak: 0, stability: 0 }
    const weeklyTrend = Array.isArray(analytics?.weeklyTrend) ? analytics.weeklyTrend : []
    const recentCheckIns = Array.isArray(analytics?.recentCheckIns) ? analytics.recentCheckIns : []

    const distributionData = useMemo(() => {
        const breakdown = analytics?.moodBreakdown || { happy: 0, excited: 0, neutral: 0, sad: 0, stressed: 0 }
        return [
            { name: "Happy", count: (breakdown.happy || 0) + (breakdown.excited || 0), color: "#00d26a" },
            { name: "Neutral", count: breakdown.neutral || 0, color: "#00c2ff" },
            { name: "Tough", count: (breakdown.sad || 0) + (breakdown.stressed || 0), color: "#7a5cff" },
        ]
    }, [analytics?.moodBreakdown])

    const rawMoodKey = String(overview?.dominantMood || "happy").toLowerCase()
    const currentMoodKey = (rawMoodKey in moodConfig ? rawMoodKey : "happy") as keyof typeof moodConfig
    const currentMood = moodConfig[currentMoodKey]
    const MoodIcon = currentMood.icon

    // FIX: Typed Recharts Tooltip without using "any"
    const CustomTimelineTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="rounded-xl border border-neutral-100 bg-white p-3 shadow-md space-y-1 max-w-[200px]">
                    <p className="text-xs font-bold text-neutral-800">{data?.day || "Day"} Entry</p>
                    {data?.mood ? (
                        <>
                            <p className="text-[11px] text-[#ff6a00] font-semibold capitalize">{data.mood}</p>
                            <p className="text-[10px] text-neutral-500">Intensity: Level {data.rank}/5</p>
                        </>
                    ) : (
                        <p className="text-[10px] text-neutral-400 italic">No entry log</p>
                    )}
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-6 font-[family-name:var(--font-plus-jakarta)] max-w-5xl mx-auto p-4 selection:bg-[#ff6a00]/10">
            
            {/* WELCOME BANNER */}
            <div className={`rounded-[32px] border ${currentMood.border} ${currentMood.bgLight} p-6 sm:p-8`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-100">
                            <span className="flex h-2 w-2 rounded-full bg-[#00d26a] animate-pulse" />
                            <span className="text-xs font-semibold text-neutral-600 tracking-wide uppercase">Current Week Focus</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                            {currentMood.greeting}!
                        </h1>
                        <p className="text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed">
                            You{"'"}ve mostly been feeling <span className={`font-bold ${currentMood.text}`}>{currentMood.label.toLowerCase()}</span> this week. Your mind baseline is steady, grounded, and building great momentum.
                        </p>
                    </div>

                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${currentMood.color} shadow-md shadow-neutral-200/50 self-start sm:self-center`}>
                        <MoodIcon className="h-8 w-8 text-white" />
                    </div>
                </div>
            </div>

            {/* QUICK HIGHLIGHT CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-2xs flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Emotional Health</p>
                        <p className="text-2xl font-bold tracking-tight text-neutral-800">
                            {overview?.emotionalScore}% <span className="text-xs font-medium text-neutral-400">vitality</span>
                        </p>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#00d26a]/10">
                        <HeartHandshake className="h-5 w-5 text-[#00a95c]" />
                    </div>
                </div>

                <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-2xs flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Weekly Streak</p>
                        <p className="text-2xl font-bold tracking-tight text-neutral-800">
                            {overview?.streak} <span className="text-xs font-medium text-neutral-400">days row</span>
                        </p>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#fff4e8]">
                        <Flame className="h-5 w-5 text-[#ff6a00]" />
                    </div>
                </div>

                <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-2xs flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Mood Balance</p>
                        <p className="text-2xl font-bold tracking-tight text-neutral-800">
                            {overview?.stability}% <span className="text-xs font-medium text-neutral-400">steady</span>
                        </p>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#eef8ff]">
                        <Activity className="h-5 w-5 text-[#00b8ff]" />
                    </div>
                </div>
            </div>

            {/* GRAPH MATRIX */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.6fr_1fr]">
                
                {/* LINEAR MON-SUN WAVE */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xs flex flex-col justify-between">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LineChart className="h-4 w-4 text-neutral-400" />
                            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Weekly Flow Calendar</h2>
                        </div>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">Current Week</span>
                    </div>

                    <div className="h-48 min-h-[192px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={currentMood.colorHex} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={currentMood.colorHex} stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600, fill: "#737373" }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTimelineTooltip />} cursor={{ stroke: '#ececec', strokeWidth: 1 }} />
                                <Area type="monotone" connectNulls dataKey="rank" stroke={currentMood.colorHex} strokeWidth={3} fillOpacity={1} fill="url(#waveGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="mt-4 text-[11px] text-neutral-400 text-center font-medium">
                        Your energy tracking progression mapped from Monday morning to Sunday night.
                    </p>
                </div>

                {/* DAILY TIME DISTRIBUTION GRAPH */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xs flex flex-col justify-between">
                    <div className="mb-6 flex items-center gap-2">
                        <Compass className="h-4 w-4 text-neutral-400" />
                        <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">All-Time Volumes</h2>
                    </div>

                    <div className="h-48 min-h-[192px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }} barSize={28}>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500, fill: "#666" }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 text-center">
                        <span className="inline-block text-[11px] font-bold text-neutral-700 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-100">
                            Peak Active Vibe: <span className="capitalize text-[#ff6a00]">{analytics?.weeklyStats?.bestDay || "---"}</span>
                        </span>
                    </div>
                </div>

            </div>

            {/* CASUAL HISTORY TEXT-CARDS */}
            {recentCheckIns.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h2 className="text-base font-bold text-neutral-800 px-1">Your Recent Thoughts</h2>
                    
                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
                        {recentCheckIns.map((item: RecentCheckInItem, index: number) => {
                            const rawItemKey = String(item.mood || "happy").toLowerCase()
                            const cardMoodKey = (rawItemKey in moodConfig ? rawItemKey : "happy") as keyof typeof moodConfig
                            const cardConfig = moodConfig[cardMoodKey]
                            const CardIcon = cardConfig.icon

                            return (
                                <div
                                    key={index}
                                    className="min-w-[260px] max-w-[260px] snap-square rounded-2xl border border-neutral-100 bg-white p-5 flex flex-col justify-between shadow-2xs hover:border-neutral-200/80 transition-colors duration-200"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cardConfig.color}`}>
                                                <CardIcon className="h-4 w-4 text-white" />
                                            </div>
                                            <span className="text-sm font-bold text-neutral-800 capitalize">{cardConfig.label}</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">
                                            Level {item.rank || 0}/5
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        {item.note ? (
                                            <p className="text-xs leading-relaxed text-neutral-600 line-clamp-3 bg-neutral-50/50 p-3 rounded-xl border border-neutral-50 italic">
                                                &ldquo;{item.note}&rdquo;
                                            </p>
                                        ) : (
                                            <p className="text-xs text-neutral-400 italic p-3">
                                                Just a quick check-in with no extra notes!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            
        </div>
    )
}