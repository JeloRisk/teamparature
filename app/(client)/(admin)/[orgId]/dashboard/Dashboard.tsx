"use client"

import { DashboardSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { positiveShare } from "@/lib/mood-reporting"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useMoodStore } from "@/app/stores/useMoodStore"
import type { Role } from "@/lib/rbac"
import MoodIcon from "@/app/components/MoodIcon"
import MoodCheck from "./MoodCheck"

interface DashboardProps {
    userRole: Role
    organization: { _id: string; name: string; slug: string }
    ownerCount: number
    memberCount: number
}

const moodOptions = [
    { key: "happy", label: "Happy", color: "#e9bb85" },
    { key: "neutral", label: "Neutral", color: "#9db8e7" },
    { key: "sad", label: "Sad", color: "#b7a4dc" },
    { key: "stressed", label: "Stressed", color: "#ead082" },
    { key: "excited", label: "Excited", color: "#e8a4bb" },
] as const

const panel = "rounded-2xl border border-border bg-card p-5 sm:p-6"
const tooltip = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 14 }

export default function Dashboard({ organization, ownerCount, memberCount }: DashboardProps) {
    const summary = useMoodStore(state => state.orgId === organization._id ? state.summary : null)
    const error = useMoodStore(state => state.orgId === organization._id ? state.error : null)
    const fetchSummary = useMoodStore(state => state.fetchSummary)
    const [now, setNow] = useState<Date | null>(null)
    useEffect(() => { setNow(new Date()) }, [])

    const trend = summary?.trend ?? []
    const today = trend.at(-1)
    const distribution = moodOptions.map(item => ({ ...item, value: today?.[item.key] ?? 0 }))
    const logs = distribution.reduce((sum, item) => sum + item.value, 0)
    const positiveCheckIns = (today?.happy ?? 0) + (today?.excited ?? 0)
    const members = ownerCount + memberCount
    const participants = summary?.participantsToday ?? 0
    const participation = members ? Math.round(participants / members * 100) : 0
    // Temperature reflects the share of positive mood check-ins, independent of intensity.
    const temperature = positiveShare(today?.happy ?? 0, today?.excited ?? 0, logs)
    const timezone = summary?.timezone ?? "UTC"
    const participationText = members
        ? `${participants} of ${members} active members checked in today`
        : "No active members yet"

    if (!summary && !error) return <DashboardSkeleton />

    return (
        <div className="-m-4 flex-1 bg-background px-4 py-6 md:-mx-10 md:px-10 sm:py-8">
            <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Team mood</h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">{organization.name}</p>
                    </div>
                    {now && <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm tabular-nums text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone })}</div>}
                </header>

                {error && <div role="alert" className="rounded-xl border border-border bg-card p-4 text-sm">{error}. <button className="text-primary underline" onClick={() => fetchSummary(organization._id)}>Retry</button></div>}

                <div className="grid gap-4 md:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.65fr)]">
                    <section className={panel}>
                        <MoodCheck orgId={organization._id} compact />
                    </section>
                    <section className={panel} aria-labelledby="today-pulse-heading">
                        <div className="flex items-center justify-between gap-4">
                            <h2 id="today-pulse-heading" className="text-lg font-semibold leading-6 tracking-tight">Today</h2>
                            <span className="text-xs text-muted-foreground">{logs} {logs === 1 ? "check-in" : "check-ins"}</span>
                        </div>
                        <div className="mt-6 grid gap-6 md:grid-cols-2 md:divide-x md:divide-border">
                            <div className="min-w-0 md:pr-6">
                                <h3 className="text-sm font-semibold text-foreground">Team temperature</h3>
                                <p className="mt-3 text-4xl font-semibold leading-none tracking-tight tabular-nums">{temperature === null ? "—" : `${temperature}%`}</p>
                                <p className="mt-2 text-sm text-muted-foreground">{logs ? `${positiveCheckIns} of ${logs} check-ins were Happy or Excited` : "No check-ins yet"}</p>

                            </div>
                            <div className="min-w-0 md:pl-6">
                                <h3 className="text-sm font-semibold text-foreground">Participation</h3>
                                <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                    <strong className="text-4xl font-semibold leading-none tracking-tight tabular-nums">{participants}</strong>
                                    <span className="text-sm text-muted-foreground">of {members} active members checked in</span>
                                </p>
                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Members checked in today" aria-valuetext={participationText} aria-valuenow={Math.min(participation, 100)} aria-valuemin={0} aria-valuemax={100}>
                                    <div className="h-full rounded-full bg-primary/70 transition-[width] duration-300" style={{ width: `${Math.min(participation, 100)}%` }} />
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                    <span className="text-muted-foreground">{participation}% of active members</span>
                                    <Link href={`/${organization._id}/members`} className="font-medium text-primary underline-offset-4 hover:underline">Manage team</Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.7fr)]">
                    <section className={`${panel} min-w-0`}>
                        <h2 className="text-lg font-semibold leading-6 tracking-tight">Today&apos;s mood mix</h2>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{logs ? "Percent of today’s check-ins" : "No responses yet"}</p>
                        <div className="mt-5 flex flex-col gap-4">
                            {distribution.map(item => <div key={item.key} className="flex items-center gap-3">
                                <MoodIcon mood={item.key} className="size-9 shrink-0" />
                                <div className="min-w-0 flex-1"><div className="mb-1.5 flex items-center justify-between gap-2 text-sm"><span className="font-medium">{item.label}</span><span className="tabular-nums text-muted-foreground">{logs ? Math.round(item.value / logs * 100) : 0}% <span className="ml-1 text-xs">({item.value})</span></span></div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${logs ? item.value / logs * 100 : 0}%` }} /></div>
                                </div>
                            </div>)}
                        </div>
                    </section>
                <section className={`${panel} min-w-0`}>
                    <div className="min-w-0">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div><h2 className="text-lg font-semibold leading-6 tracking-tight">This week</h2><p className="mt-1 text-sm text-muted-foreground">Daily check-ins by mood</p></div>
                            <Link href={`/${organization._id}/analytics`} className="text-sm font-medium text-primary">Explore analytics</Link>
                        </div>
                        {trend.some(day => moodOptions.some(item => day[item.key] > 0)) ? <div className="h-60 min-w-0" role="img" aria-label="Stacked area chart showing daily check-in counts for each mood over seven days">
                            <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 4, bottom: 0, left: 0 }}>
                                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                                <YAxis domain={[0, (dataMax: number) => Math.max(1, dataMax)]} allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                                <Tooltip contentStyle={tooltip} />
                                {moodOptions.map(item => <Area key={item.key} name={item.label} type="linear" dataKey={item.key} stackId="moods" stroke={item.color} strokeWidth={1.5} fill={item.color} fillOpacity={0.4} />)}
                            </AreaChart></ResponsiveContainer>
                        </div> : <div className="flex h-60 items-center justify-center text-center text-sm text-muted-foreground">Check-ins will appear here as your team logs a mood.</div>}
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">{moodOptions.map(item => <span key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
                    </div>

                </section>
                </div>

                <p className="pb-1 text-xs text-muted-foreground">Today is based on {timezone.replaceAll("_", " ")}. Temperature counts mood choice, not intensity; see Analytics for intensity.</p>
            </div>
        </div>
    )
}
