"use client"

import { DashboardSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import TeamTemperatureCard from "../TeamTemperatureCard"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useMoodStore } from "@/app/stores/useMoodStore"
import type { Role } from "@/lib/rbac"
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

const panel = "min-w-0 rounded-2xl border border-border bg-card p-4 @md/home:p-5"
const sectionLink = "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-1.5 text-xs font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring @md/home:text-sm"
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

export default function Dashboard({ organization, ownerCount, memberCount }: DashboardProps) {
    const summary = useMoodStore(state => state.orgId === organization._id ? state.summary : null)
    const error = useMoodStore(state => state.orgId === organization._id ? state.error : null)
    const fetchSummary = useMoodStore(state => state.fetchSummary)
    const [activity, setActivity] = useState<ActivityEntry[]>([])
    const [activityLoading, setActivityLoading] = useState(true)
    const [activityError, setActivityError] = useState("")
    const [activityRevision, setActivityRevision] = useState(0)

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
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const selected = trend.find(day => day.day === selectedDay)
    const totals = trend.map(day => moodOptions.reduce((sum, mood) => sum + day[mood.key], 0))
    const peak = Math.max(1, ...totals)
    const distribution = moodOptions.map(item => ({
        ...item,
        value: selected ? selected[item.key] : trend.reduce((sum, day) => sum + day[item.key], 0),
    }))
    const displayTotal = distribution.reduce((sum, item) => sum + item.value, 0)
    const members = summary?.activeMemberCount ?? ownerCount + memberCount
    const participantsThisWeek = summary?.participantsThisWeek ?? 0

    const timezone = summary?.timezone ?? "UTC"

    if (!summary && !error) return <DashboardSkeleton />

    return (
        <div className="@container/home mx-auto w-full min-w-0 max-w-6xl space-y-5 py-1 sm:space-y-6 sm:py-3">
            <MoodCheck key={organization._id} orgId={organization._id} compact />
            {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
                {error}. <button type="button" className={sectionLink} onClick={() => fetchSummary(organization._id)}>Retry</button>
            </div>}

            <section aria-labelledby="team-overview-heading">
                <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h2 id="team-overview-heading" className="text-xl leading-tight @md/home:text-2xl">Team overview</h2>
                    <p className="text-xs text-muted-foreground @md/home:text-sm">Last 7 days</p>
                </header>
                <div className="grid grid-cols-2 gap-3 @md/home:gap-4 @3xl/home:grid-cols-[1.25fr_1fr_1fr_1fr]">
                    <TeamTemperatureCard periodLabel={selected?.day} items={distribution} total={displayTotal} available={Boolean(summary)} />
                    <section className={panel} aria-labelledby="dashboard-participation-heading">
                        <h3 id="dashboard-participation-heading" className="text-sm leading-5 @md/home:text-base">Participation</h3>
                        <p className="mt-2 text-3xl font-semibold leading-none tracking-tight tabular-nums @md/home:text-4xl">
                            {summary ? participantsThisWeek.toLocaleString() : "—"}
                            {summary && <span className="ml-1.5 text-base font-medium text-muted-foreground">of {members.toLocaleString()}</span>}
                        </p>
                        {summary && members > 0 && <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, participantsThisWeek / members * 100)}%` }} />
                        </div>}
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Members who checked in</p>
                    </section>
                    <section className={panel} aria-labelledby="dashboard-active-members-heading">
                        <h3 id="dashboard-active-members-heading" className="text-sm leading-5 @md/home:text-base">Active members</h3>
                        <p className="mt-2 text-3xl font-semibold leading-none tracking-tight tabular-nums @md/home:text-4xl">{summary ? members.toLocaleString() : "—"}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">In the workspace today</p>
                        <Link href={`/${organization._id}/members`} className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-ring">
                            View members <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </section>
                </div>
            </section>

            <div className="grid min-w-0 gap-3 @md/home:gap-4 @3xl/home:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <section className={panel} aria-labelledby="weekly-chart-heading">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 sm:mb-4">
                            <div className="min-w-0">
                                <h2 id="weekly-chart-heading" className="text-lg leading-6">Daily check-ins</h2>
                                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Last 7 days</p>
                            </div>
                            <Link href={`/${organization._id}/analytics`} className={sectionLink}>
                                View analytics
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">Select a day to filter the mood breakdown.</p>
                        <div className="mt-3 grid grid-cols-7 gap-1">
                            {trend.map((day, index) => <button key={day.day} type="button" aria-pressed={selected?.day === day.day} aria-label={`${day.day}, ${totals[index]} check-ins`} onClick={() => setSelectedDay(selected?.day === day.day ? null : day.day)} className="min-w-0 rounded-lg px-1 py-2 text-xs hover:bg-muted focus-visible:outline-ring aria-pressed:bg-accent aria-pressed:ring-2 aria-pressed:ring-primary">
                                <span>{totals[index]}</span>
                                <span className="mx-auto my-1 flex h-28 max-w-10 flex-col-reverse overflow-hidden rounded-t-md bg-muted/60">
                                    {moodOptions.map(mood => <span key={mood.key} style={{ height: `${day[mood.key] / peak * 100}%`, backgroundColor: mood.color }} />)}
                                </span>
                                {day.day}
                            </button>)}
                        </div>
                        <div className="mt-3 border-t border-border pt-3" aria-live="polite">
                            <div className="flex items-center justify-between text-sm font-medium">
                                {selected ? `${selected.day} moods` : "Weekly moods"}
                                {selected && <button type="button" className={sectionLink} onClick={() => setSelectedDay(null)}>Whole week</button>}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {displayTotal ? distribution.filter(item => item.value).map(item => <span key={item.key} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label} {item.value}</span>) : summary ? "No check-ins recorded." : "Check-in data unavailable."}
                            </div>
                        </div>
                    </div>

                </section>

                <section className={`${panel} flex flex-col`} aria-labelledby="recent-activity-heading">
                    <div className="flex items-center justify-between gap-3">
                        <h2 id="recent-activity-heading" className="text-lg font-semibold leading-6 tracking-tight">Recent activity</h2>
                        <Link href={`/${organization._id}/activity`} className={sectionLink}>
                            See more
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>
                    <div className="mt-3 flex flex-1 flex-col border-t border-border" aria-live="polite">
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
                        </ul> : <div className="my-auto py-7 text-center">
                            <p className="text-sm font-medium">No activity recorded yet</p>
                            <p className="mx-auto mt-1 max-w-[34ch] text-sm text-muted-foreground">Workspace updates and member changes will appear here.</p>
                        </div>}
                    </div>
                </section>
            </div>
        </div>
    )
}
