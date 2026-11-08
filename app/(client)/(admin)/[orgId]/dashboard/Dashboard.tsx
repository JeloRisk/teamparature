"use client"

import { DashboardSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { positiveShare } from "@/lib/mood-reporting"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, Users, ClipboardCheck, ArrowUpRight, Thermometer, ArrowUp, ArrowDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useMoodStore } from "@/app/stores/useMoodStore"
import { useUserStore } from "@/app/stores/useUserStore"
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

const panel = "rounded-3xl border border-border/60 bg-card/95 p-5 shadow-[0_8px_30px_-24px_rgba(79,94,217,0.22)] sm:p-6"
const tooltip = { backgroundColor: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 14 }

export default function Dashboard({ organization, ownerCount, memberCount }: DashboardProps) {
    const summary = useMoodStore(state => state.orgId === organization._id ? state.summary : null)
    const error = useMoodStore(state => state.orgId === organization._id ? state.error : null)
    const fetchSummary = useMoodStore(state => state.fetchSummary)
    const user = useUserStore(state => state.user)
    const [now, setNow] = useState<Date | null>(null)
    useEffect(() => { setNow(new Date()) }, [])

    const trend = summary?.trend ?? []
    const today = trend.at(-1)
    const yesterday = trend.at(-2)
    const distribution = moodOptions.map(item => ({ ...item, value: today?.[item.key] ?? 0 }))
    const logs = distribution.reduce((sum, item) => sum + item.value, 0)
    const members = ownerCount + memberCount
    const participants = summary?.participantsToday ?? 0
    const participation = members ? Math.round(participants / members * 100) : 0
    // Temperature reflects the share of positive mood check-ins, independent of intensity.
    const positive = (today?.happy ?? 0) + (today?.excited ?? 0)
    const temperature = positiveShare(today?.happy ?? 0, today?.excited ?? 0, logs)
    const previousTotal = yesterday ? moodOptions.reduce((sum, item) => sum + yesterday[item.key], 0) : 0
    const previous = positiveShare(yesterday?.happy ?? 0, yesterday?.excited ?? 0, previousTotal)
    const change = temperature !== null && previous !== null ? temperature - previous : null
    const timezone = summary?.timezone ?? "UTC"
    const hour = now ? Number(new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(now)) : 0
    const greeting = !now ? "Welcome" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
    const name = user?.firstName ?? user?.name?.split(" ")[0]

    if (!summary && !error) return <DashboardSkeleton />

    return (
        <div className="-m-4 flex-1 bg-background px-4 py-6 md:-mx-10 md:px-10 sm:py-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="relative isolate flex flex-wrap items-start justify-between gap-4">
                    <div aria-hidden="true" className="pointer-events-none absolute -left-4 -top-6 -z-10 h-40 w-72 max-w-full rounded-full bg-[#b7c8ff]/30 blur-3xl dark:bg-primary/10" />
                    <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">{organization.name}</p>
                        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{greeting}{name ? `, ${name}` : ""}.</h1>
                        <p className="mt-2 text-sm text-muted-foreground">A little perspective on how your team is feeling.</p>
                    </div>
                    {now && <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/70 px-3 py-2 text-xs text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone })}</div>}
                </header>

                {error && <div role="alert" className="rounded-xl border border-border bg-card p-4 text-sm">{error}. <button className="text-primary underline" onClick={() => fetchSummary(organization._id)}>Retry</button></div>}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[0.85fr_1.35fr_1fr]">
                    <section className={`${panel} md:col-span-2 xl:col-span-1`}>
                        <MoodCheck orgId={organization._id} compact />
                    </section>
                    <section className={`${panel} relative overflow-hidden bg-gradient-to-br from-card to-accent/30`}>
                        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent/40 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Thermometer className="size-4 text-primary" aria-hidden="true" />Team temperature</h2>
                                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">Today</span>
                            </div>
                            <div className="mt-5 flex items-end justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-5xl font-semibold leading-none tracking-tight text-primary">{temperature === null ? "—" : `${temperature}%`}</p>
                                    <p className="mt-3 text-sm text-muted-foreground">{logs ? "Happy or Excited check-ins" : "Waiting for today’s first check-in"}</p>
                                </div>
                                <svg aria-hidden="true" viewBox="0 0 160 100" className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl opacity-90 sm:h-20 sm:w-28 dark:opacity-60">
                                    <path d="M16 30c4-9 12-11 19-8 8-14 26-13 32 1 9-1 16 2 19 7Z" className="fill-white/75 dark:fill-primary/15" />
                                    <circle cx="112" cy="57" r="24" fill="#f6d590" />
                                    <path d="M0 76C25 55 43 57 68 72S111 45 160 62V100H0Z" fill="#c6d5ff" />
                                    <path d="M0 88C27 68 52 93 82 79S126 64 160 74V100H0Z" fill="#aabfff" />
                                </svg>
                            </div>
                            <p className="mt-4 text-xs leading-5 text-muted-foreground">{logs ? `${positive} of ${logs} responses are positive. Every mood is part of the picture.` : "The summary will appear as people share how they feel."}</p>
                            <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                                {change === null ? "A comparison appears when today and yesterday both have responses." : <span className="inline-flex items-center gap-1.5">
                                    {change > 0 ? <ArrowUp className="size-3.5" aria-hidden="true" /> : change < 0 ? <ArrowDown className="size-3.5" aria-hidden="true" /> : null}
                                    {change === 0 ? "No change" : `${Math.abs(change)} percentage points ${change > 0 ? "higher" : "lower"}`} in positive share compared with yesterday.
                                </span>}
                            </div>
                        </div>
                    </section>

                    <section className={panel}>
                        <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight"><ClipboardCheck className="size-4 text-primary" aria-hidden="true" />Participation</h2><span className="text-[11px] text-muted-foreground">Today</span></div>
                        <p className="mt-6 flex items-baseline gap-2"><strong className="text-4xl font-semibold tracking-tight">{participants}</strong><span className="text-sm text-muted-foreground">of {members} members checked in</span></p>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Members checked in today" aria-valuenow={Math.min(participation, 100)} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full bg-primary/65" style={{ width: `${Math.min(participation, 100)}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{participation}% participation</p>
                        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5" aria-hidden="true" />{members} active members</span>
                            <Link href={`/${organization._id}/members`} className="flex items-center gap-1 text-xs font-medium text-primary">Manage team<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
                        </div>
                    </section>
                </div>

                <div className="grid items-stretch gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <section className={`${panel} min-w-0`}>
                        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                            <div><h2 className="text-lg font-semibold tracking-tight">The week at a glance</h2><p className="mt-1.5 text-xs text-muted-foreground">Daily check-ins by mood · Last 7 days</p></div>
                            <Link href={`/${organization._id}/analytics`} className="flex items-center gap-1 text-xs font-medium text-primary">Explore analytics<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
                        </div>
                        {trend.some(day => moodOptions.some(item => day[item.key] > 0)) ? <div className="h-60 min-w-0" role="img" aria-label="Stacked area chart showing daily check-in counts for each mood over seven days">
                            <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 4, bottom: 0, left: 0 }}>
                                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                                <YAxis domain={[0, (dataMax: number) => Math.max(1, dataMax)]} allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                                <Tooltip contentStyle={tooltip} />
                                {moodOptions.map(item => <Area key={item.key} name={item.label} type="linear" dataKey={item.key} stackId="moods" stroke={item.color} strokeWidth={1.5} fill={item.color} fillOpacity={0.4} />)}
                            </AreaChart></ResponsiveContainer>
                        </div> : <div className="flex h-60 items-center justify-center rounded-xl bg-muted/40 text-center text-sm text-muted-foreground">Your team’s first check-ins will start the story here.</div>}
                        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">{moodOptions.map(item => <span key={item.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
                    </section>

                    <section className={`${panel} flex flex-col`}>
                        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold tracking-tight">Today’s mood mix</h2><span className="text-[11px] text-muted-foreground">{logs} check-in{logs === 1 ? "" : "s"}</span></div>
                        <div className="mt-5 flex flex-1 flex-col justify-between gap-4">
                            {distribution.map(item => <div key={item.key} className="flex items-center gap-3">
                                <MoodIcon mood={item.key} className="size-9 shrink-0" />
                                <div className="min-w-0 flex-1"><div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-medium">{item.label}</span><span className="text-muted-foreground">{logs ? Math.round(item.value / logs * 100) : 0}% <span className="ml-1 text-[10px]">({item.value})</span></span></div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${logs ? item.value / logs * 100 : 0}%` }} /></div>
                                </div>
                            </div>)}
                        </div>
                        {!logs && <p className="mt-4 text-xs text-muted-foreground">No responses today yet.</p>}
                    </section>
                </div>

                <p className="pb-1 text-[11px] text-muted-foreground">Today follows {timezone.replaceAll("_", " ")}. Temperature reflects mood choice; intensity is reported separately in Analytics.</p>
            </div>
        </div>
    )
}
