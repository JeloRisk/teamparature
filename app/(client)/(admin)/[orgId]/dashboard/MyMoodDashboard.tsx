"use client"

import { useEffect } from "react"
import {
    Flame,
    Activity,
    HeartHandshake,
    Sparkles,
    Smile,
    Meh,
    Frown,
} from "lucide-react"

import { useMyMood } from "@/app/stores/useMyMood"

const moodConfig = {
    happy: {
        icon: Smile,
        color: "bg-[#00d26a]",
        bgLight: "bg-[#00d26a]/5",
        border: "border-[#00d26a]/10",
        text: "text-[#00a95c]",
        label: "Happy",
        greeting: "Radiant & bright",
    },
    excited: {
        icon: Sparkles,
        color: "bg-[#ff2d8d]",
        bgLight: "bg-[#ff2d8d]/5",
        border: "border-[#ff2d8d]/10",
        text: "text-[#ff2d8d]",
        label: "Excited",
        greeting: "Full of energy",
    },
    neutral: {
        icon: Meh,
        color: "bg-[#00c2ff]",
        bgLight: "bg-[#00c2ff]/5",
        border: "border-[#00c2ff]/10",
        text: "text-[#00b8ff]",
        label: "Neutral",
        greeting: "Calm & steady",
    },
    sad: {
        icon: Frown,
        color: "bg-[#7a5cff]",
        bgLight: "bg-[#7a5cff]/5",
        border: "border-[#7a5cff]/10",
        text: "text-[#7a5cff]",
        label: "Sad",
        greeting: "A bit low",
    },
    stressed: {
        icon: Flame,
        color: "bg-[#ffb800]",
        bgLight: "bg-[#ffb800]/5",
        border: "border-[#ffb800]/10",
        text: "text-[#ff9500]",
        label: "Stressed",
        greeting: "Feeling overwhelmed",
    },
}

export default function MyMoodDashboard() {
    const {
        analytics,
        loading,
        fetchMyMoodAnalytics,
    } = useMyMood()

    useEffect(() => {
        fetchMyMoodAnalytics()
    }, [fetchMyMoodAnalytics])

    if (loading || !analytics) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#111] border-t-transparent mx-auto" />
                    <p className="text-sm text-neutral-400">Setting up your space...</p>
                </div>
            </div>
        )
    }

    const currentMoodKey = analytics.overview.dominantMood as keyof typeof moodConfig
    const currentMood = moodConfig[currentMoodKey] || moodConfig.happy
    const MoodIcon = currentMood.icon

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 font-[family-name:var(--font-plus-jakarta)]">
            
            {/* HERO WELCOME CARD */}
            <div className="rounded-[32px] border border-[#f0f0f0] bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <span className="text-xs font-semibold tracking-wider text-[#8f8f95] uppercase">
                            Your Energy Pulse
                        </span>
                        <h1 className="text-4xl font-bold tracking-tight text-[#111]">
                            Looking good this week!
                        </h1>
                        <p className="text-sm text-[#666] leading-relaxed max-w-xl">
                            Your overall emotional vitality sits at <strong className="text-[#111] font-semibold">{analytics.overview.emotionalScore}%</strong>. 
                            Your mind is doing an incredible job finding its rhythm and bouncing back beautifully.
                        </p>
                    </div>
                    
                    {/* Floating Status Badge */}
                    <div className={`flex items-center gap-3 rounded-2xl ${currentMood.bgLight} ${currentMood.border} border p-4 self-start sm:self-center`}>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${currentMood.color} text-white`}>
                            <MoodIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-[#8f8f95] uppercase tracking-wider">Mostly Feeling</p>
                            <p className="text-sm font-bold text-[#111] capitalize">{currentMood.label}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIGHTWEIGHT QUICK VIBES ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Mindfulness Streak */}
                <div className="rounded-[24px] border border-[#f0f0f0] bg-white p-5 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#8f8f95]">
                            Daily Momentum
                        </span>
                        <h3 className="text-2xl font-bold tracking-tight text-[#111]">
                            {analytics.overview.streak} Days In a Row
                        </h3>
                        <p className="text-xs text-[#666]">
                            Proud of you for taking time to check in on yourself!
                        </p>
                    </div>
                    <div className="rounded-xl bg-[#fff4e8] p-3">
                        <Flame className="h-5 w-5 text-[#ff6a00]" />
                    </div>
                </div>

                {/* Inner Equilibrium */}
                <div className="rounded-[24px] border border-[#f0f0f0] bg-white p-5 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#8f8f95]">
                            Your Inner Balance
                        </span>
                        <h3 className="text-2xl font-bold tracking-tight text-[#111]">
                            {analytics.overview.stability}% Consistent
                        </h3>
                        <p className="text-xs text-[#666]">
                            You're moving gently and smoothly between your feelings.
                        </p>
                    </div>
                    <div className="rounded-xl bg-[#eef8ff] p-3">
                        <Activity className="h-5 w-5 text-[#00b8ff]" />
                    </div>
                </div>

            </div>

            {/* WEEKLY RECAP GRID */}
            <div className="rounded-[28px] border border-[#f0f0f0] bg-white p-6 shadow-sm">
                <div className="mb-4">
                    <h2 className="text-lg font-bold tracking-tight text-[#111]">
                        Days Spent Loving, Learning & Living
                    </h2>
                    <p className="text-xs text-[#8f8f95]">
                        A friendly summary of your check-ins over the past week.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    <div className="rounded-xl bg-[#fafafa] p-4 text-center">
                        <p className="text-xs font-medium text-[#8f8f95]">Total Moments Logged</p>
                        <p className="text-2xl font-bold text-[#111] mt-1">{analytics.weeklyStats.totalCheckIns}</p>
                    </div>

                    <div className="rounded-xl bg-[#00d26a]/5 border border-[#00d26a]/10 p-4 text-center">
                        <p className="text-xs font-medium text-[#00a95c]">Bright & Sunny Days</p>
                        <p className="text-2xl font-bold text-[#111] mt-1">{analytics.weeklyStats.positiveDays}</p>
                    </div>

                    <div className="rounded-xl bg-[#ffb800]/5 border border-[#ffb800]/10 p-4 text-center">
                        <p className="text-xs font-medium text-[#ff9500]">Calm & Steady Days</p>
                        <p className="text-2xl font-bold text-[#111] mt-1">{analytics.weeklyStats.neutralDays}</p>
                    </div>

                    <div className="rounded-xl bg-[#ff2d8d]/5 border border-[#ff2d8d]/10 p-4 text-center">
                        <p className="text-xs font-medium text-[#ff4d4f]">Tougher Moments</p>
                        <p className="text-2xl font-bold text-[#111] mt-1">{analytics.weeklyStats.negativeDays}</p>
                    </div>

                </div>
            </div>

            {/* RECENT STORIES TIMELINE */}
            <div className="rounded-[28px] border border-[#f0f0f0] bg-white p-6 shadow-sm">
                <div className="mb-4">
                    <h2 className="text-lg font-bold tracking-tight text-[#111]">
                        Your Recent Thoughts
                    </h2>
                    <p className="text-xs text-[#8f8f95]">
                        Flip back through the pages of your past few logs.
                    </p>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {analytics.recentCheckIns.map((item, index) => {
                        const cardConfig = moodConfig[item.mood as keyof typeof moodConfig] || moodConfig.happy
                        const CardIcon = cardConfig.icon

                        return (
                            <div
                                key={index}
                                className="min-w-[220px] max-w-[240px] rounded-2xl border border-[#f5f5f5] bg-[#fafafa] p-4 flex flex-col justify-between gap-4 transition-all duration-200 hover:bg-white hover:shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cardConfig.color} text-white shadow-sm`}>
                                        <CardIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#111] capitalize leading-none">
                                            {cardConfig.label}
                                        </h4>
                                        <span className="text-[10px] text-[#8f8f95]">
                                            {cardConfig.greeting}
                                        </span>
                                    </div>
                                </div>

                                {item.note ? (
                                    <p className="text-xs leading-relaxed text-[#555] bg-white p-3 rounded-xl border border-[#fdfdfd] line-clamp-3">
                                        "{item.note}"
                                    </p>
                                ) : (
                                    <p className="text-[11px] leading-relaxed text-[#b3b3b3] p-3 italic">
                                        Just a quick tap-in check.
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            
        </div>
    )
}