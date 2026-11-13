"use client"

import { DashboardSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { positiveShare } from "@/lib/mood-reporting"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, CalendarDays } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { BarProps } from "recharts"
import type { BarRectangleItem } from "recharts/types/cartesian/Bar"
import { useMoodStore } from "@/app/stores/useMoodStore"
import type { Role } from "@/lib/rbac"
import MoodIcon from "@/app/components/MoodIcon"
import MoodCheck from "./MoodCheck"
import { activityActions, type ActivityAction } from "@/lib/activity-actions"

interface DashboardProps {
    userRole: Role
    organization: { _id: string; name: string; slug: string }
    ownerCount: number
    memberCount: number
}

const moodOptions = [
    { key: "happy", label: "Happy", color: "var(--mood-happy)" },
    { key: "excited", label: "Excited", color: "var(--mood-excited)" },
    { key: "neutral", label: "Neutral", color: "var(--mood-neutral)" },
    { key: "sad", label: "Sad", color: "var(--mood-sad)" },
    { key: "stressed", label: "Stressed", color: "var(--mood-stressed)" },
] as const

const panel = "min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6"
const tooltip = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 14 }
type MoodMixItem = (typeof moodOptions)[number] & { value: number }
type MoodTrendDay = Record<(typeof moodOptions)[number]["key"], number> & { day: string }

function temperatureTrendSegments(days: MoodTrendDay[]) {
    const segments: { x: number; y: number }[][] = []
    let current: { x: number; y: number }[] = []

    days.forEach((day, index) => {
        const total = moodOptions.reduce((sum, item) => sum + day[item.key], 0)
        if (!total) {
            if (current.length) segments.push(current)
            current = []
            return
        }

        const share = (day.happy + day.excited) / total
        current.push({
            x: 156 + index * (154 / Math.max(days.length - 1, 1)),
            y: 145 - share * 112,
        })
    })

    if (current.length) segments.push(current)
    return segments
}

function smoothTemperaturePath(points: { x: number; y: number }[]) {
    if (points.length < 2) return ""

    let path = `M ${points[0].x} ${points[0].y}`
    for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1]
        const point = points[index]
        const control = (previous.x + point.x) / 2
        path += ` C ${control} ${previous.y} ${control} ${point.y} ${point.x} ${point.y}`
    }
    return path
}

interface ActivityEntry {
    _id: string
    actorName: string
    action: ActivityAction
    targetLabel: string
    previousRole?: string
    newRole?: string
    outcome: "pending" | "succeeded" | "failed"
    createdAt: string
}

function MoodMixBar({ items, total, emptyMessage }: { items: MoodMixItem[]; total: number; emptyMessage: string }) {
    const highest = Math.max(0, ...items.map(item => item.value))

    if (!total) return <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>

    return <div className="mt-4">
        <div aria-label={`Mood mix from ${total} check-ins`} role="img" className="flex h-14 items-center gap-1.5">
            {items.map(item => <div key={item.key} title={`${item.label}: ${item.value} ${item.value === 1 ? "check-in" : "check-ins"}`} className={`flex min-w-0 items-center justify-center rounded-xl ${item.value === highest ? "h-14" : "h-12"}`} style={{ flexGrow: item.value, flexBasis: 0, backgroundColor: item.color }}>
                <MoodIcon mood={item.key} variant="mobile" className="size-6 shrink-0 sm:size-7" />
            </div>)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Mood check-in counts">
            {items.map(item => <li key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
                <span className="font-medium tabular-nums text-foreground">{item.value}</span>
            </li>)}
        </ul>
    </div>
}

export default function Dashboard({ organization, ownerCount, memberCount }: DashboardProps) {
    const summary = useMoodStore(state => state.orgId === organization._id ? state.summary : null)
    const error = useMoodStore(state => state.orgId === organization._id ? state.error : null)
    const fetchSummary = useMoodStore(state => state.fetchSummary)
    const [now, setNow] = useState<Date | null>(null)
    const [activity, setActivity] = useState<ActivityEntry[]>([])
    const [activityLoading, setActivityLoading] = useState(true)
    const [activityError, setActivityError] = useState("")
    const [activityRevision, setActivityRevision] = useState(0)
    useEffect(() => { setNow(new Date()) }, [])

    useEffect(() => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        setActivityLoading(true)
        setActivityError("")
        async function loadActivity() {
            try {
                const response = await fetch(`/api/orgs/${organization._id}/activity?page=1&sort=newest`, { signal: controller.signal })
                const data = await response.json()
                if (!response.ok) throw new Error(data.error || "Could not load recent activity")
                if (!controller.signal.aborted) setActivity((data.activities as ActivityEntry[]).slice(0, 5))
            } catch (error) {
                if (!controller.signal.aborted) setActivityError(error instanceof Error && error.name !== "AbortError" ? error.message : "The request timed out. Please try again.")
            } finally {
                clearTimeout(timeout)
                if (!controller.signal.aborted) setActivityLoading(false)
            }
        }
        void loadActivity()
        return () => { clearTimeout(timeout); controller.abort() }
    }, [organization._id, activityRevision])

    const trend = summary?.trend ?? []
    const weeklyDistribution = moodOptions.map(item => ({
        ...item,
        value: trend.reduce((sum, day) => sum + day[item.key], 0),
    }))
    const checkInsThisWeek = weeklyDistribution.reduce((sum, item) => sum + item.value, 0)
    const activeWeeklyMoods = moodOptions.filter(item => trend.some(day => day[item.key] > 0))
    const members = ownerCount + memberCount
    const participantsThisWeek = summary?.participantsThisWeek ?? 0
    const happyThisWeek = weeklyDistribution.find(item => item.key === "happy")?.value ?? 0
    const excitedThisWeek = weeklyDistribution.find(item => item.key === "excited")?.value ?? 0
    const temperature = positiveShare(happyThisWeek, excitedThisWeek, checkInsThisWeek)
    const timezone = summary?.timezone ?? "UTC"
    const weeklyParticipationText = !summary
        ? "Participation unavailable"
        : members
        ? `${participantsThisWeek} of ${members} active members checked in this week`
        : checkInsThisWeek ? "No active members · check-in activity shown" : "No active members yet"

    if (!summary && !error) return <DashboardSkeleton />

    return (
        <div className="dashboard-reference-theme mobile-page -m-4 min-w-0 flex-1 bg-background px-4 py-5 sm:py-8 md:-mx-10 md:px-10">
            <div className="mobile-page-content mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-5">
                <header className="mobile-page-header flex flex-wrap items-start justify-between gap-3 pb-4 sm:items-end sm:gap-4 sm:pb-5">
                    <div className="min-w-0">
                        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-3xl">
                            <span className="sm:hidden">Welcome back</span>
                            <span className="hidden sm:inline">Team mood</span>
                        </h1>
                        <p className="mt-1.5 hidden break-words text-sm text-muted-foreground sm:block">Workspace <span aria-hidden="true">·</span> <span className="font-medium text-foreground">{organization.name}</span></p>
                        {now && <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground sm:hidden">
                            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: timezone })}
                        </p>}
                    </div>
                    <div aria-hidden="true" className="relative mt-1 h-[4.75rem] w-[5.5rem] shrink-0 sm:hidden">
                        <MoodIcon mood="happy" variant="mobile" className="absolute left-0 top-3 size-10 -rotate-12" />
                        <MoodIcon mood="excited" variant="mobile" className="absolute right-1 top-0 size-12 rotate-6" />
                        <MoodIcon mood="stressed" variant="mobile" className="absolute bottom-0 right-0 size-10 rotate-12" />
                    </div>
                    {now && <div className="hidden min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-2 text-base font-medium tabular-nums text-foreground sm:flex">
                        <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone })}
                    </div>}
                </header>

                {error && <div role="alert" className="rounded-xl border border-border bg-card p-4 text-sm">{error}. <button className="text-primary underline" onClick={() => fetchSummary(organization._id)}>Retry</button></div>}

                <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]">
                    <section className={`${panel} ${summary?.checkedInToday ? "xl:self-center" : ""}`}>
                        <MoodCheck orgId={organization._id} compact />
                    </section>
                    <section className={panel} aria-labelledby="total-checkins-heading">
                        <h2 id="total-checkins-heading" className="text-base font-medium leading-6 text-foreground">Total check-ins</h2>
                        <p className="mt-3 text-4xl font-semibold leading-none tracking-tight tabular-nums text-foreground">{checkInsThisWeek}</p>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">Across 7 days</p>
                        <MoodMixBar items={weeklyDistribution.filter(item => item.value > 0)} total={checkInsThisWeek} emptyMessage="No check-ins across the last 7 days." />
                    </section>
                    <section className="relative min-h-56 min-w-0 overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.035] p-4 sm:p-6" aria-label={`Team Temperature: ${temperature === null ? "no check-ins in the last 7 days" : `${temperature}% over the last 7 days`}`}>
                        {checkInsThisWeek > 0 && <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-primary" viewBox="0 0 320 160" preserveAspectRatio="none">
                            {temperatureTrendSegments(trend as MoodTrendDay[]).map((segment, index) => segment.length === 1
                                ? <circle key={index} cx={segment[0].x} cy={segment[0].y} r="3" fill="currentColor" fillOpacity="0.3" />
                                : <path key={index} d={smoothTemperaturePath(segment)} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" strokeLinecap="round" />)}
                        </svg>}
                        <div className="relative z-10">
                            <h2 className="text-base font-medium leading-6 text-foreground">Team Temperature</h2>
                            <p className="mt-1 text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-4xl">{temperature === null ? "—" : `${temperature}%`}</p>
                            <p className="mt-2 text-sm leading-5 text-foreground">{temperature === null ? "No check-ins across the last 7 days." : "Generally positive mood"}</p>
                            <p className="sr-only">Daily team temperature trend across the last seven days, based on Happy and Excited check-ins.</p>
                        </div>
                    </section>
                </div>

                <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(17rem,0.8fr)]">
                <section className={`${panel} min-w-0`}>
                    <div className="min-w-0">
                        <div className="mb-4 sm:mb-5">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold leading-6 tracking-tight">This week</h2>
                                <Link href={`/${organization._id}/analytics`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline sm:min-h-0">
                                    See full analytics
                                    <ArrowUpRight className="size-4" aria-hidden="true" />
                                </Link>
                            </div>
                            <div>
                                <p className="mt-1.5 text-sm text-muted-foreground">{weeklyParticipationText}</p>
                            </div>
                        </div>
                        {trend.some(day => moodOptions.some(item => day[item.key] > 0)) ? <div className="h-48 min-w-0 px-0 pt-2 sm:h-64 sm:p-0 xl:h-72" role="img" aria-label={`Daily check-in counts by mood over seven days; ${checkInsThisWeek} total check-ins`}>
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} barCategoryGap="24%">
                                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                                <YAxis domain={[0, (dataMax: number) => Math.max(1, dataMax)]} allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                                <Tooltip contentStyle={tooltip} />
                                {moodOptions.map((item, moodIndex) => <Bar
                                    key={item.key}
                                    name={item.label}
                                    dataKey={item.key}
                                    stackId="moods"
                                    fill={item.color}
                                    maxBarSize={40}
                                    shape={(props: BarProps) => {
                                        const rect = props as unknown as BarRectangleItem
                                        const day = trend[Number(props.index)]
                                        const lowerMoodPresent = moodOptions.slice(0, moodIndex).some(mood => (day?.[mood.key] ?? 0) > 0)
                                        const higherMoodPresent = moodOptions.slice(moodIndex + 1).some(mood => (day?.[mood.key] ?? 0) > 0)
                                        const radius: [number, number, number, number] = [
                                            higherMoodPresent ? 0 : 10,
                                            higherMoodPresent ? 0 : 10,
                                            lowerMoodPresent ? 0 : 10,
                                            lowerMoodPresent ? 0 : 10,
                                        ]
                                        return <Rectangle x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={item.color} radius={radius} />
                                    }}
                                />)}
                            </BarChart></ResponsiveContainer>
                        </div> : <div className="flex h-60 items-center justify-center text-center text-sm text-muted-foreground">Check-ins will appear here as your team logs a mood.</div>}
                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 border-t border-border pt-3 sm:mt-4 sm:gap-x-5 sm:pt-4">{activeWeeklyMoods.map(item => <span key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
                    </div>

                </section>

                <section className={panel} aria-labelledby="recent-activity-heading">
                    <div className="flex items-center justify-between gap-3">
                        <h2 id="recent-activity-heading" className="text-lg font-semibold leading-6 tracking-tight">Recent activity</h2>
                        <Link href={`/${organization._id}/activity`} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline sm:min-h-0">
                            See more
                            <ArrowUpRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>
                    <div className="mt-3 border-t border-border" aria-live="polite">
                        {activityLoading ? <p role="status" className="py-5 text-center text-sm text-muted-foreground">Loading recent activity…</p>
                        : activityError ? <div className="py-5 text-center text-sm"><p role="alert" className="text-muted-foreground">{activityError}</p><button type="button" onClick={() => setActivityRevision(value => value + 1)} className="mt-2 font-medium text-primary underline underline-offset-4">Try again</button></div>
                        : activity.length ? <ul className="divide-y divide-border">
                            {activity.map(entry => <li key={entry._id} className="flex min-w-0 items-start justify-between gap-3 py-3 first:pt-3 last:pb-0">
                                <div className="min-w-0">
                                    <p className="break-words text-sm font-medium leading-5">{activityActions[entry.action]}</p>
                                    <p title={`${entry.targetLabel} · ${entry.actorName}`} className="mt-0.5 truncate text-sm leading-5 text-muted-foreground">{entry.targetLabel}<span aria-hidden="true"> · </span>{entry.actorName}</p>
                                </div>
                                <time dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString(undefined, { timeZone: timezone, dateStyle: "full", timeStyle: "short" })} className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                                    {new Date(entry.createdAt).toLocaleDateString(undefined, { timeZone: timezone, month: "short", day: "numeric" })}
                                </time>
                            </li>)}
                        </ul> : <div className="py-7 text-center">
                            <p className="text-sm font-medium">No activity recorded yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">Workspace updates and member changes will appear here.</p>
                        </div>}
                    </div>
                </section>
                </div>
            </div>
        </div>
    )
}
