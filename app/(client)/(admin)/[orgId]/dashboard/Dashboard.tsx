"use client"

import { DashboardSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { positiveShare } from "@/lib/mood-reporting"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"
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

const panel = "min-w-0 rounded-2xl border border-border p-4 sm:p-5"
const sectionLink = "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm"
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
            x: 10 + index * (154 / Math.max(days.length - 1, 1)),
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
        <div aria-label={items.map(item => `${item.label}: ${item.value} check-ins`).join("; ")} role="img" className="flex h-14 items-center gap-1.5">
            {items.map(item => <div key={item.key} title={`${item.label}: ${item.value} ${item.value === 1 ? "check-in" : "check-ins"}`} className={`flex min-w-0 items-center justify-center rounded-xl ${item.value === highest ? "h-14" : "h-12"}`} style={{ flexGrow: item.value, flexBasis: 0, backgroundColor: item.color }}>
                <MoodIcon mood={item.key} variant="mobile" className="size-5 shrink-0 sm:size-6" />
            </div>)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Mood check-in counts">
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
        let cancelled = false
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
                if (!cancelled) setActivityError(error instanceof Error && error.name !== "AbortError" ? error.message : "The request timed out. Please try again.")
            } finally {
                clearTimeout(timeout)
                if (!cancelled) setActivityLoading(false)
            }
        }
        void loadActivity()
        return () => { cancelled = true; clearTimeout(timeout); controller.abort() }
    }, [organization._id, activityRevision])

    const trend = summary?.trend ?? []
    const weeklyDistribution = moodOptions.map(item => ({
        ...item,
        value: trend.reduce((sum, day) => sum + day[item.key], 0),
    }))
    const checkInsThisWeek = weeklyDistribution.reduce((sum, item) => sum + item.value, 0)
    const activeWeeklyMoods = moodOptions.filter(item => trend.some(day => day[item.key] > 0))
    const members = summary?.activeMemberCount ?? ownerCount + memberCount
    const participantsThisWeek = summary?.participantsThisWeek ?? 0
    const segments = temperatureTrendSegments(trend as MoodTrendDay[]).filter(segment => segment.length > 1)
    const happyThisWeek = weeklyDistribution.find(item => item.key === "happy")?.value ?? 0
    const excitedThisWeek = weeklyDistribution.find(item => item.key === "excited")?.value ?? 0
    const temperature = positiveShare(happyThisWeek, excitedThisWeek, checkInsThisWeek)
    const timezone = summary?.timezone ?? "UTC"

    if (!summary && !error) return <DashboardSkeleton />

    return (
        <div className="dashboard-reference-theme workspace-page-surface mobile-page -m-4 min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-7 md:-mx-10 md:px-10">
            <div className="mx-auto min-w-0 max-w-6xl space-y-3 sm:space-y-5">
                <section className={`${panel} bg-card`} aria-labelledby="team-mood-heading">
                    <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                        <div className="min-w-0">
                            <h1 id="team-mood-heading" className="text-2xl leading-tight tracking-tight sm:text-4xl">Team mood</h1>
                            <p className="mt-1 hidden text-sm break-words text-muted-foreground md:block">{organization.name}</p>
                        </div>
                        {now && <p className="flex min-h-8 shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:min-h-9 sm:text-sm">
                            <CalendarDays className="size-3.5 sm:size-4" aria-hidden="true" />
                            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: timezone })}
                        </p>}
                    </header>
                    <div className="mt-3.5 border-t border-border pt-3.5 sm:mt-5 sm:pt-5">
                        {error && <div role="alert" className="mb-3 rounded-xl border border-border bg-card p-3 text-sm">
                            {error}. <button type="button" className="text-primary underline" onClick={() => fetchSummary(organization._id)}>Retry</button>
                        </div>}
                        <MoodCheck orgId={organization._id} compact />
                    </div>
                </section>

                <div className="grid min-w-0 grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]">
                    <section className={`${panel} col-span-2 bg-card sm:col-span-1`} aria-labelledby="total-checkins-heading">
                        <h2 id="total-checkins-heading" className="text-base leading-5">Total check-ins</h2>
                        <p className="mt-3 text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-4xl">{summary ? checkInsThisWeek : "—"}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm">Last 7 days</p>
                        <MoodMixBar items={weeklyDistribution.filter(item => item.value > 0)} total={checkInsThisWeek} emptyMessage="No check-ins across the last 7 days." />
                    </section>
                    <section className={`${panel} col-span-2 bg-card sm:col-span-1`} aria-labelledby="team-temperature-heading">
                        <h2 id="team-temperature-heading" className="text-base leading-5">Team Temperature</h2>
                        <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
                            <p className="text-[2rem] font-semibold leading-none tracking-tight tabular-nums sm:text-4xl">{temperature === null ? "—" : `${temperature}%`}</p>
                            {segments.length > 0 && <svg role="img" aria-label="Daily team temperature trend over the last seven days" className="h-9 w-24 shrink-0 text-primary" viewBox="0 18 174 140" preserveAspectRatio="none">
                                {segments.map((segment, index) => <path key={index} d={smoothTemperaturePath(segment)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
                            </svg>}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm">{temperature === null ? "No check-ins yet" : `${happyThisWeek + excitedThisWeek} of ${checkInsThisWeek} ${checkInsThisWeek === 1 ? "check-in was" : "check-ins were"} Happy or Excited`}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
                    </section>

                    <div className="col-span-2 grid grid-cols-2 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card xl:col-span-1 xl:grid-cols-1 xl:divide-x-0 xl:divide-y">
                    <section className="min-w-0 p-4 sm:px-5" aria-labelledby="dashboard-participation-heading">
                        <h2 id="dashboard-participation-heading" className="text-base leading-5">Participation</h2>
                        <p className="mt-2 text-2xl font-semibold leading-none tabular-nums">{summary ? `${participantsThisWeek} of ${members}` : "—"}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{summary ? "members checked in during the last 7 days" : "Participation unavailable"}</p>
                    </section>
                    <section className="min-w-0 p-4 sm:px-5" aria-labelledby="dashboard-active-members-heading">
                        <h2 id="dashboard-active-members-heading" className="text-base leading-5">Active members</h2>
                        <p className="mt-2 text-2xl font-semibold leading-none tabular-nums">{summary ? members.toLocaleString() : "—"}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Workspace members, including owners</p>
                    </section>
                    </div>
                </div>

                <div className="grid min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,1fr)]">
                <section className={`${panel} bg-card`}>
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 sm:mb-4">
                            <div className="min-w-0">
                                <h2 className="text-lg leading-6">Daily check-ins by mood</h2>
                                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Last 7 days</p>
                            </div>
                            <Link href={`/${organization._id}/analytics`} className={sectionLink}>
                                Full analytics
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
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
                        {activeWeeklyMoods.length > 0 && <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 border-t border-border pt-3 sm:mt-4 sm:gap-x-5 sm:pt-4">{activeWeeklyMoods.map(item => <span key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>}
                    </div>

                </section>

                <section className={`${panel} bg-card`} aria-labelledby="recent-activity-heading">
                    <div className="flex items-center justify-between gap-3">
                        <h2 id="recent-activity-heading" className="text-lg font-semibold leading-6 tracking-tight">Recent activity</h2>
                        <Link href={`/${organization._id}/activity`} className={sectionLink}>
                            See more
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>
                        <div className="mt-3 border-t border-border" aria-live="polite">
                        {activityLoading ? <p role="status" className="py-5 text-center text-sm text-muted-foreground">Loading recent activity…</p>
                        : activityError ? <div className="py-5 text-center text-sm"><p role="alert" className="text-muted-foreground">{activityError}</p><button type="button" onClick={() => setActivityRevision(value => value + 1)} className="mt-2 font-medium text-primary underline underline-offset-4">Try again</button></div>
                        : activity.length ? <ul className="divide-y divide-border">
                            {activity.map(entry => <li key={entry._id} className="flex min-w-0 items-start justify-between gap-3 py-3 first:pt-3 last:pb-0">
                                <div className="min-w-0 flex-1">
                                    <p className="break-words text-sm font-medium leading-5">{activityActions[entry.action]}</p>
                                    <p className="mt-0.5 break-words text-sm leading-5 text-muted-foreground">{entry.targetLabel}<span aria-hidden="true"> · </span>{entry.actorName}</p>
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
