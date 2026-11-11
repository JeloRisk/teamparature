"use client"

import { DashboardSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { positiveShare } from "@/lib/mood-reporting"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { BarProps } from "recharts"
import type { BarRectangleItem } from "recharts/types/cartesian/Bar"
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
    { key: "happy", label: "Happy", color: "var(--mood-happy)" },
    { key: "excited", label: "Excited", color: "var(--mood-excited)" },
    { key: "neutral", label: "Neutral", color: "var(--mood-neutral)" },
    { key: "sad", label: "Sad", color: "var(--mood-sad)" },
    { key: "stressed", label: "Stressed", color: "var(--mood-stressed)" },
] as const

const panel = "min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6"
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
    const checkInsThisWeek = trend.reduce((sum, day) => sum + moodOptions.reduce((daySum, item) => daySum + day[item.key], 0), 0)
    const positiveCheckIns = (today?.happy ?? 0) + (today?.excited ?? 0)
    const members = ownerCount + memberCount
    const participants = summary?.participantsToday ?? 0
    const participantsThisWeek = summary?.participantsThisWeek ?? 0
    const participation = members ? Math.round(participants / members * 100) : 0
    // Temperature reflects the share of positive mood check-ins, independent of intensity.
    const temperature = positiveShare(today?.happy ?? 0, today?.excited ?? 0, logs)
    const timezone = summary?.timezone ?? "UTC"
    const participationText = members
        ? `${participants} of ${members} active members checked in today`
        : "No active members yet"
    const weeklyParticipationText = !summary
        ? "Participation unavailable"
        : members
        ? `${checkInsThisWeek} ${checkInsThisWeek === 1 ? "check-in" : "check-ins"} from ${participantsThisWeek} of ${members} active members`
        : `${checkInsThisWeek} ${checkInsThisWeek === 1 ? "check-in" : "check-ins"} · no active members`

    if (!summary && !error) return <DashboardSkeleton />

    return (
        <div className="dashboard-reference-theme -m-4 min-w-0 flex-1 bg-background px-4 py-5 sm:py-8 md:-mx-10 md:px-10">
            <div className="mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-5">
                <header className="flex flex-wrap items-start justify-between gap-3 pb-4 sm:items-end sm:gap-4 sm:pb-5">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Team mood</h1>
                        <p className="mt-1.5 break-words text-sm text-muted-foreground">Workspace <span aria-hidden="true">·</span> <span className="font-medium text-foreground">{organization.name}</span></p>
                    </div>
                    {now && <div className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-2 text-base font-medium tabular-nums text-foreground">
                        <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="sm:hidden">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: timezone })}</span>
                        <span className="hidden sm:inline">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone })}</span>
                    </div>}
                </header>

                {error && <div role="alert" className="rounded-xl border border-border bg-card p-4 text-sm">{error}. <button className="text-primary underline" onClick={() => fetchSummary(organization._id)}>Retry</button></div>}

                <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.65fr)]">
                    <section className={panel}>
                        <MoodCheck orgId={organization._id} compact />
                    </section>
                    <section className={panel} aria-labelledby="today-pulse-heading">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 id="today-pulse-heading" className="text-lg font-semibold leading-6 tracking-tight">Today</h2>
                            <span className="text-xs text-muted-foreground">{logs} {logs === 1 ? "check-in" : "check-ins"}</span>
                        </div>
                        <div className="mt-4 grid gap-4 min-[380px]:grid-cols-2 min-[380px]:gap-0 min-[380px]:divide-x min-[380px]:divide-border md:mt-6 md:gap-6">
                            <div className="min-w-0 min-[380px]:pr-4 md:pr-6">
                                <h3 className="text-sm font-semibold text-foreground">Team temperature</h3>
                                <p className="mt-2 text-4xl font-semibold leading-none tracking-tight tabular-nums">{temperature === null ? "—" : `${temperature}%`}</p>
                                <p className="mt-2 text-sm text-muted-foreground">{logs ? `${positiveCheckIns} of ${logs} check-ins were Happy or Excited` : "No check-ins yet"}</p>

                            </div>
                            <div className="min-w-0 min-[380px]:pl-4 md:pl-6">
                                <h3 className="text-sm font-semibold text-foreground">Participation</h3>
                                <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                    <strong className="text-4xl font-semibold leading-none tracking-tight tabular-nums">{participants}</strong>
                                    <span className="text-sm text-muted-foreground">of {members} active members checked in</span>
                                </p>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Members checked in today" aria-valuetext={participationText} aria-valuenow={Math.min(participation, 100)} aria-valuemin={0} aria-valuemax={100}>
                                    <div className="h-full rounded-full bg-primary/70 transition-[width] duration-300" style={{ width: `${Math.min(participation, 100)}%` }} />
                                </div>
                                <p className="mt-3 text-xs text-muted-foreground">{participation}% of active members</p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.7fr)]">
                    <section className={`${panel} min-w-0`}>
                        <h2 className="text-lg font-semibold leading-6 tracking-tight">Today&apos;s mood mix</h2>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{logs ? "Percent of today’s check-ins" : "No responses yet"}</p>
                        <div className="mt-4 flex flex-col gap-4 sm:mt-5">
                            {distribution.map(item => <div key={item.key} className="flex items-center gap-3">
                                <MoodIcon mood={item.key} variant="mobile" className="size-9 shrink-0" />
                                <div className="min-w-0 flex-1"><div className="mb-1.5 flex items-center justify-between gap-2 text-sm"><span className="font-medium">{item.label}</span><span className="tabular-nums text-muted-foreground">{logs ? Math.round(item.value / logs * 100) : 0}% <span className="ml-1 text-xs">({item.value})</span></span></div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${logs ? item.value / logs * 100 : 0}%` }} /></div>
                                </div>
                            </div>)}
                        </div>
                    </section>
                <section className={`${panel} min-w-0`}>
                    <div className="min-w-0">
                        <div className="mb-4 sm:mb-5">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold leading-6 tracking-tight">This week</h2>
                                <Link href={`/${organization._id}/analytics`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline sm:min-h-0">Explore analytics</Link>
                            </div>
                            <div>
                                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{weeklyParticipationText}</p>
                            </div>
                        </div>
                        {trend.some(day => moodOptions.some(item => day[item.key] > 0)) ? <div className="h-48 min-w-0 sm:h-60" role="img" aria-label="Stacked bar chart showing daily check-in counts for each mood over seven days">
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 10, right: 40, bottom: 0, left: 0 }} barCategoryGap="28%">
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
                                    maxBarSize={48}
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
                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 border-t border-border pt-3 sm:mt-4 sm:gap-x-5 sm:pt-4">{moodOptions.map(item => <span key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
                    </div>

                </section>
                </div>

            </div>
        </div>
    )
}
