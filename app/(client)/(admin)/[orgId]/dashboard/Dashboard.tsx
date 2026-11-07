"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, Users, ClipboardCheck, TrendingUp, Sparkles, Leaf, ArrowUpRight, Smile } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useMoodStore } from "@/app/stores/useMoodStore"
import { useUserStore } from "@/app/stores/useUserStore"
import type { Role } from "@/lib/rbac"
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

const panel = "rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm dark:border-border dark:bg-card sm:p-6"
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
    const temperature = logs ? Math.round(positive / logs * 100) : null
    const previousTotal = yesterday ? moodOptions.reduce((sum, item) => sum + yesterday[item.key], 0) : 0
    const previous = yesterday && previousTotal ? Math.round((yesterday.happy + yesterday.excited) / previousTotal * 100) : null
    const change = temperature !== null && previous !== null ? temperature - previous : null
    const mostCommon = [...distribution].sort((a, b) => b.value - a.value)[0]
    const greeting = !now ? "Welcome" : now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening"
    const name = user?.firstName ?? user?.name?.split(" ")[0]
    const value = (number: number) => summary ? number : "—"

    return (
        <div className="-m-4 flex-1 bg-background px-4 py-6 dark:bg-background md:-mx-10 md:px-10">
            <div className="mx-auto max-w-7xl space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-foreground">{greeting}{name ? `, ${name}` : ""} <span aria-hidden="true">👋</span></h1>
                        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">Here’s how {organization.name} is feeling today.</p>
                    </div>
                    {now && <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-card dark:text-foreground"><CalendarDays className="size-4 text-primary" />{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>}
                </header>

                {error && <div role="alert" className="rounded-xl bg-card p-4 text-sm">{error}. <button className="underline" onClick={() => fetchSummary(organization._id)}>Retry</button></div>}
                <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
                    <section className="relative isolate overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white to-indigo-200 p-6 shadow-sm dark:border-border dark:from-card dark:to-accent sm:col-span-3">
                        <div aria-hidden="true" className="absolute -bottom-12 -right-6 size-44 rounded-full bg-[#9db8e7]/30" />
                        <div aria-hidden="true" className="absolute -bottom-20 right-24 size-48 rounded-full bg-[#b7a4dc]/20" />
                        <h2 className="relative flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-primary" />Team temperature</h2>
                        <div className="relative mt-3 flex items-center gap-3"><span className="text-5xl font-semibold tracking-tight text-primary">{temperature === null ? "—" : `${temperature}%`}</span><span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium dark:bg-background/50">{logs ? "Positive check-ins" : "Awaiting check-ins"}</span></div>
                        <p className="relative mt-3 text-sm text-muted-foreground dark:text-muted-foreground">{logs ? `${positive} of ${logs} check-ins are Happy or Excited today.` : "Your team’s responses will appear here as they check in."}</p>
                    </section>
                    {[
                        { label: "Team members", number: members, detail: "Active workspace members", icon: Users },
                        { label: "Checked in today", number: participants, detail: `${participation}% participation`, icon: ClipboardCheck },
                        { label: "vs. yesterday", number: change === null ? null : `${change > 0 ? "+" : ""}${change} pp`, detail: "Change in positive share", icon: TrendingUp },
                    ].map(({ label, number, detail, icon: Icon }) => <section key={label} className={panel}>
                        <span className="mb-3 grid size-10 place-items-center rounded-2xl bg-accent text-primary"><Icon className="size-5" /></span>
                        <p className="text-3xl font-semibold tracking-tight">{typeof number === "number" ? value(number) : number ?? "—"}</p><h2 className="mt-1 text-sm font-medium">{label}</h2><p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                    </section>)}
                </div>

                <div className="grid items-stretch gap-4 xl:grid-cols-[1.1fr_1fr_0.9fr]">
                    <section className={panel}><h2 className="mb-4 flex items-center gap-2 font-semibold"><Smile className="size-5 text-primary" />Quick check-in</h2><MoodCheck orgId={organization._id} /></section>
                    <section className={panel}>
                        <h2 className="font-semibold">Mood distribution <span className="text-xs font-normal text-muted-foreground">Today</span></h2>
                        {logs ? <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                            <div className="relative h-40 w-40">
                                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} nameKey="label" dataKey="value" innerRadius={53} outerRadius={72} stroke="none">{distribution.map(item => <Cell key={item.key} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltip} /></PieChart></ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl">{logs}</strong><span className="text-xs text-muted-foreground">Check-ins</span></div>
                            </div>
                            <ul className="min-w-32 flex-1 space-y-2">{distribution.map(item => <li key={item.key} className="flex items-center gap-2 text-xs"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}<span className="ml-auto font-medium">{Math.round(item.value / logs * 100)}% ({item.value})</span></li>)}</ul>
                        </div> : <p className="flex min-h-44 items-center justify-center text-sm text-muted-foreground">{summary ? "No check-ins today yet." : "Loading check-ins…"}</p>}
                    </section>
                    <section className={panel}>
                        <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-primary" />Team insights</h2>
                        <ul className="mt-5 space-y-5 text-sm leading-6 text-muted-foreground">
                            <li className="flex gap-3"><Leaf className="mt-1 size-5 shrink-0 text-primary" /><span>{change === null ? "A daily comparison appears once both days have responses." : `The share of positive check-ins is ${Math.abs(change)} percentage points ${change >= 0 ? "higher" : "lower"} than yesterday.`}</span></li>
                            <li className="flex gap-3"><Users className="mt-1 size-5 shrink-0 text-primary" /><span>{logs ? `${mostCommon.label} is ${distribution.filter(item => item.value === mostCommon.value).length > 1 ? "one of the most common moods" : "the most common mood"} today.` : "Mood patterns will appear as your team checks in."}</span></li>
                            <li className="flex gap-3"><ClipboardCheck className="mt-1 size-5 shrink-0 text-primary" /><span>{participants} of {members} active members have checked in today.</span></li>
                        </ul>
                    </section>
                </div>

                <section className={panel}>
                    <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-semibold">Mood trend</h2><p className="mt-1 text-xs text-muted-foreground">Team check-ins over the last 7 days</p></div><Link href={`/${organization._id}/analytics`} className="flex items-center gap-1 text-xs font-medium text-primary">View analytics<ArrowUpRight className="size-4" /></Link></div>
                    <div className="h-64 min-w-0" role="img" aria-label="Stacked chart showing check-in counts by mood over the last seven days">
                        <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}>
                            <CartesianGrid vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                            <Tooltip contentStyle={tooltip} />
                            {moodOptions.map(item => <Area key={item.key} name={item.label} type="monotone" dataKey={item.key} stackId="moods" stroke={item.color} fill={item.color} fillOpacity={0.75} />)}
                        </AreaChart></ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">{moodOptions.map(item => <span key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
                </section>
            </div>
        </div>
    )
}
