import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { getWorkspaceTimezone } from "@/lib/workspace-time"
import MoodIcon, { type MoodName } from "@/app/components/MoodIcon"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDays, ChevronLeft, ChevronRight, Minus } from "lucide-react"
import { addDays, addMonths, format, isSameDay, isValid, startOfMonth, startOfWeek, startOfYear } from "date-fns"
import { Mood } from "@/models/Mood"
import { getWorkspaceMembership } from "../workspace-access"

const views = ["Daily", "Weekly", "Monthly"] as const
const moods = {
    happy: ["😊", "Happy"],
    excited: ["🤩", "Excited"],
    neutral: ["😐", "Neutral"],
    sad: ["😔", "Sad"],
    stressed: ["😰", "Stressed"],
} as const

type Entry = { date: Date; mood: keyof typeof moods; rank: number }

export default async function MoodOverviewPage({ params, searchParams }: {
    params: Promise<{ orgId: string }>
    searchParams: Promise<{ view?: string; date?: string }>
}) {
    const { orgId } = await params
    const membership = await getWorkspaceMembership(orgId)
    if (membership?.role !== "member") notFound()

    const query = await searchParams
    const view = views.find(item => item.toLowerCase() === query.view) ?? "Daily"
    const timezone = await getWorkspaceTimezone(orgId)
    const today = toZonedTime(new Date(), timezone)
    const requested = typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
        ? new Date(`${query.date}T00:00:00`)
        : today
    const date = isValid(requested) ? requested : today
    const weekStart = (value: Date) => startOfWeek(value, { weekStartsOn: 1 })
    const start = view === "Monthly" ? startOfYear(date)
        : view === "Weekly" ? weekStart(startOfMonth(date)) : weekStart(date)
    const anchor = view === "Weekly" ? startOfMonth(date) : start
    const shift = (step: number) => view === "Daily" ? addDays(anchor, step * 7)
        : addMonths(anchor, step * (view === "Monthly" ? 12 : 1))
    const monthEnd = addMonths(anchor, 1)
    const weekCount = Array.from({ length: 6 }, (_, i) => addDays(start, i * 7))
        .filter(day => day < monthEnd).length
    const size = view === "Daily" ? 7 : view === "Weekly" ? weekCount : 12
    const boundary = (i: number) => view === "Monthly" ? addMonths(start, i)
        : addDays(start, i * (view === "Weekly" ? 7 : 1))
    const end = boundary(size)
    const entries = await Mood.find({ organization: orgId, user: membership.user, date: { $gte: fromZonedTime(start, timezone), $lt: fromZonedTime(end, timezone) } })
        .select("date mood rank").sort({ date: -1 }).lean<Entry[]>()
    const range = view === "Monthly" ? format(start, "yyyy")
        : view === "Weekly" ? format(anchor, "MMMM yyyy")
        : `${format(start, "MMM d")} – ${format(addDays(end, -1), "MMM d, yyyy")}`
    const href = (nextView: typeof view, nextDate: Date) =>
        `/${orgId}/mood-overview?view=${nextView.toLowerCase()}&date=${format(nextDate, "yyyy-MM-dd")}`
    const arrow = "grid size-10 place-items-center rounded-xl text-slate-700 dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"

    return (
        <div className="-m-4 flex-1 bg-background dark:bg-background px-4 py-6 sm:py-10 md:-mx-10 md:px-10">
            <section className="max-w-6xl">
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                            <span className="rounded-lg bg-orange-100 dark:bg-[#423c30] p-1.5 text-orange-700 dark:text-[#e1c590]"><CalendarDays className="size-4" aria-hidden="true" /></span>
                            Personal check-ins
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-foreground">Mood Overview</h1>
                        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">A look back at how you’ve been feeling.</p>
                    </div>
                    <nav aria-label="Overview period" className="flex w-full gap-1 rounded-xl border border-border dark:border-border bg-card dark:bg-card p-1 sm:w-auto">
                        {views.map(item => (
                            <Link key={item} href={href(item, date)} aria-current={view === item ? "page" : undefined}
                                className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${view === item ? "bg-primary text-primary-foreground" : "text-slate-700 dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent"}`}>
                                {item}
                            </Link>
                        ))}
                    </nav>
                </header>

                <div className="overflow-hidden rounded-2xl border border-border dark:border-border bg-card dark:bg-card shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border dark:border-border px-3 py-2 sm:px-5">
                        <nav aria-label="Date navigation" className="flex items-center gap-1">
                            <Link href={href(view, shift(-1))} aria-label="Previous period" className={arrow}><ChevronLeft className="size-4" /></Link>
                            <span className="text-sm font-semibold text-slate-800 dark:text-foreground">{range}</span>
                            <Link href={href(view, shift(1))} aria-label="Next period" className={arrow}><ChevronRight className="size-4" /></Link>
                        </nav>
                        <Link href={href(view, today)} className="rounded-lg px-3 py-2 text-sm font-medium text-primary dark:text-primary hover:bg-accent dark:hover:bg-accent">Today</Link>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 p-3 min-[400px]:grid-cols-3 sm:gap-3 sm:p-5 ${view === "Daily" ? "xl:grid-cols-7" : "xl:grid-cols-6"}`}>
                        {Array.from({ length: size }, (_, i) => {
                            const from = boundary(i)
                            const to = boundary(i + 1)
                            const matches = entries.filter(entry => {
                                const localDate = toZonedTime(entry.date, timezone)
                                return localDate >= from && localDate < to
                            })
                            const entry = matches[0]
                            const isToday = view === "Daily" && isSameDay(from, today)
                            const breakdown = Object.entries(moods).map(([mood, [emoji, label]]) => ({
                                mood,
                                emoji,
                                label,
                                count: matches.filter(item => item.mood === mood).length,
                            })).filter(item => item.count > 0)
                            return (
                                <div key={from.toISOString()} className={`flex min-h-36 flex-col items-center rounded-xl border px-2 py-4 text-center ${entry ? "border-border dark:border-border bg-accent dark:bg-accent" : "border-border dark:border-border bg-slate-50/60 dark:bg-muted/60"} ${isToday ? "ring-2 ring-inset ring-ring" : ""}`}>
                                    <p className="text-sm font-semibold text-foreground dark:text-foreground">{format(from, view === "Daily" ? "EEE" : view === "Weekly" ? "'Week of' MMM d" : "MMMM")}</p>
                                    {view === "Daily" && <p className="text-xs text-muted-foreground dark:text-muted-foreground">{isToday ? "Today · " : ""}{format(from, "MMM d")}</p>}
                                    {entry && view === "Daily" ? (
                                        <>
                                            <MoodIcon mood={entry.mood} className="mt-2 size-11" />
                                            <p className="text-sm font-semibold text-foreground dark:text-foreground">{moods[entry.mood][1]}</p>
                                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">{entry.rank}/5</p>
                                        </>
                                    ) : entry ? (
                                        <>
                                            <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">{matches.length} check-in{matches.length === 1 ? "" : "s"}</p>
                                            <ul aria-label="Mood breakdown" className="mt-2 flex flex-wrap justify-center gap-1">
                                                {breakdown.map(item => (
                                                    <li key={item.mood} aria-label={`${item.label}: ${item.count}`} className="rounded-full bg-card dark:bg-card px-2 py-1 text-xs text-slate-700 dark:text-muted-foreground">
                                                        <span aria-hidden="true" className="flex items-center gap-1"><MoodIcon mood={item.mood as MoodName} className="size-6" />{item.count}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <>
                                            <span className="mb-1 mt-3 rounded-full bg-muted dark:bg-muted p-1.5 text-muted-foreground dark:text-muted-foreground">
                                                <Minus className="size-3.5" aria-hidden="true" />
                                            </span>
                                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">{view === "Daily" ? "No entry" : "No check-ins"}</p>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
