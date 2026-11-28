"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import MoodIcon from "@/app/components/MoodIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip"
import { heatmapMoods, type HeatmapMood } from "@/lib/mood-heatmap"
import { moodColors } from "../analytics/heatmap-colors"
import ChartCard2 from "../analytics/components/analytics/ChartCard2"

type MoodEntry = { date: string; mood: HeatmapMood; rank: number }
type Period = "year" | "month"
type DateRange = { start: string; end: string }

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const moodLabels: Record<HeatmapMood, string> = { happy: "Happy", excited: "Excited", neutral: "Neutral", sad: "Sad", stressed: "Stressed" }

function dayKey(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function monthWeekRange(year: number, month: number, weekIndex: number, today: string): DateRange | null {
    const monthLength = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const first = weekIndex * 7 + 1
    if (first > monthLength) return null
    const last = Math.min(first + 6, monthLength)
    const start = dayKey(year, month, first)
    const end = dayKey(year, month, last)
    return { start, end: start <= today && end > today ? today : end }
}

function formatDay(key: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`))
}

function formatRange(range: DateRange) {
    if (range.start === range.end) return formatDay(range.start)
    const startYear = range.start.slice(0, 4)
    const endYear = range.end.slice(0, 4)
    return startYear === endYear
        ? `${formatDay(range.start, { month: "short", day: "numeric" })} – ${formatDay(range.end)}`
        : `${formatDay(range.start)} – ${formatDay(range.end)}`
}

function moodCounts(entries: MoodEntry[]) {
    return Object.fromEntries(heatmapMoods.map(mood => [mood, entries.filter(entry => entry.mood === mood).length])) as Record<HeatmapMood, number>
}

function dominantMood(entries: MoodEntry[]) {
    if (!entries.length) return undefined
    const counts = moodCounts(entries)
    const highest = Math.max(...Object.values(counts))
    const leaders = heatmapMoods.filter(mood => counts[mood] === highest)
    return leaders.length === 1 ? leaders[0] : "neutral"
}

function MoodCell({ range, entries, today, onSelect, monthCell = false, selected = false, dayNumber }: {
    range: DateRange
    entries: MoodEntry[]
    today: string
    onSelect: (range: DateRange) => void
    monthCell?: boolean
    selected?: boolean
    dayNumber?: number
}) {
    const mood = dominantMood(entries)
    const future = range.start > today
    const counts = moodCounts(entries)
    const highest = Math.max(...Object.values(counts))
    const leaders = entries.length ? heatmapMoods.filter(name => counts[name] === highest) : []
    const label = future ? "Not yet occurred" : !entries.length ? "No check-ins" : leaders.length > 1 ? `Tied moods: ${leaders.map(name => moodLabels[name]).join(", ")}` : `${moodLabels[mood!]} was most common`
    const background = future ? "var(--muted)" : mood ? moodColors[mood] : "var(--muted)"
    const accessibleLabel = `${formatRange(range)}. ${label}${entries.length ? `, ${entries.length} check-in${entries.length === 1 ? "" : "s"}` : ""}`

    return <Tooltip>
        <TooltipTrigger asChild>
            <button type="button" disabled={future} onClick={() => onSelect(range)} aria-pressed={selected} aria-label={accessibleLabel}
                style={{ backgroundColor: background }}
                className={`group relative z-0 grid aspect-square min-w-0 place-items-center transition-[transform,box-shadow] duration-150 hover:z-10 hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-primary/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default ${monthCell ? "rounded-lg p-0.5" : "rounded-md"} ${selected ? "z-[1] border-2 border-primary" : "border-2 border-transparent"} ${future ? "border border-dashed border-border opacity-30" : "cursor-pointer"}`}>
                {dayNumber !== undefined && <span className="absolute left-1 top-0.5 text-[9px] font-medium leading-none text-foreground/70 sm:left-1.5 sm:top-1 sm:text-[10px]">{dayNumber}</span>}
                {mood && !future && <MoodIcon mood={mood} className={`${monthCell ? "mt-2 size-5 sm:size-7" : "size-5 sm:size-8"}`} variant="mobile" />}
            </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
            <p className="text-xs font-medium text-muted-foreground">{formatRange(range)}</p>
            <p className="mt-1 font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{entries.length} check-in{entries.length === 1 ? "" : "s"}</p>
            {entries.length > 0 && <div className="mt-3 grid grid-cols-5 gap-1 border-t border-border pt-2">
                {heatmapMoods.map(name => <div key={name} className="flex flex-col items-center gap-1 text-[10px] capitalize text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: moodColors[name] }} />{counts[name]}</div>)}
            </div>}
        </TooltipContent>
    </Tooltip>
}

export default function MemberEmotionHeatmap({ year, currentYear, today, entries }: {
    year: number
    currentYear: number
    today: string
    entries: MoodEntry[]
}) {
    const router = useRouter()
    const pathname = usePathname()
    const yearListRef = useRef<HTMLDivElement>(null)
    const selectedYearRef = useRef<HTMLButtonElement>(null)
    const latestEntry = entries.at(-1)
    const [period, setPeriod] = useState<Period>("month")
    const [yearPickerOpen, setYearPickerOpen] = useState(false)
    const [month, setMonth] = useState(() => latestEntry && Number(latestEntry.date.slice(0, 4)) === year
        ? Number(latestEntry.date.slice(5, 7)) - 1
        : year === currentYear ? Number(today.slice(5, 7)) - 1 : 11)
    const [selectedRange, setSelectedRange] = useState<DateRange | null>(() => {
        return latestEntry ? { start: latestEntry.date, end: latestEntry.date } : null
    })
    const yearOptions = Array.from({ length: currentYear - 1999 }, (_, index) => 2000 + index)
    useEffect(() => {
        const list = yearListRef.current
        const selected = selectedYearRef.current
        if (!yearPickerOpen || !list || !selected) return
        const selectedOffset = selected.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop
        list.scrollTop = Math.max(0, selectedOffset - (list.clientHeight - selected.offsetHeight) / 2)
    }, [yearPickerOpen])
    const entryOn = (key: string) => entries.filter(entry => entry.date === key)
    const selectYear = (nextYear: number, nextMonth = month) => {
        const currentMonth = Number(today.slice(5, 7)) - 1
        setMonth(nextYear === currentYear ? Math.min(nextMonth, currentMonth) : nextMonth)
        const params = new URLSearchParams(window.location.search)
        params.set("year", String(nextYear))
        setSelectedRange(null)
        setYearPickerOpen(false)
        router.push(`${pathname}?${params.toString()}`)
    }
    const monthDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const monthOffset = new Date(Date.UTC(year, month, 1)).getUTCDay()
    const monthCells: (number | null)[] = [
        ...Array.from({ length: monthOffset }, () => null),
        ...Array.from({ length: monthDays }, (_, index) => index + 1),
    ]
    while (monthCells.length % 7) monthCells.push(null)
    const selectedEntries = selectedRange
        ? entries.filter(entry => entry.date >= selectedRange.start && entry.date <= selectedRange.end)
        : []
    const latestYear = year === currentYear
    const isSelected = (range: DateRange) => Boolean(selectedRange && selectedRange.start <= range.end && selectedRange.end >= range.start)

    const changeMonth = (direction: -1 | 1) => {
        const nextMonth = month + direction
        if (nextMonth < 0 && year > 2000) selectYear(year - 1, 11)
        else if (nextMonth > 11 && year < currentYear) selectYear(year + 1, 0)
        else if (nextMonth >= 0 && nextMonth <= 11) { setMonth(nextMonth); setSelectedRange(null) }
    }
    const changeYear = (direction: -1 | 1) => {
        const nextYear = year + direction
        if (nextYear >= 2000 && nextYear <= currentYear) selectYear(nextYear)
    }

    return <section className="workspace-page-surface mx-auto w-full max-w-6xl min-w-0 text-foreground" aria-label="Mood overview">
        <ChartCard2 title="Emotion heatmap">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div role="group" aria-label="Heatmap time scale" className="inline-flex w-fit shrink-0 rounded-xl bg-muted p-1">
                    {(["month", "year"] as const).map(option => <button key={option} type="button" aria-pressed={period === option} onClick={() => { setPeriod(option); setYearPickerOpen(false) }}
                        className={`min-h-11 rounded-lg px-2.5 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3 ${period === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        {option}
                    </button>)}
                </div>
                <div role="group" aria-label={period === "month" ? "Month navigation" : "Year navigation"} className="flex min-w-44 flex-1 items-center justify-between gap-1 sm:flex-none sm:justify-end sm:gap-2">
                    <button type="button" aria-label={period === "month" ? "Previous month" : "Previous year"} disabled={period === "month" ? year === 2000 && month === 0 : year === 2000} onClick={() => period === "month" ? changeMonth(-1) : changeYear(-1)} className="grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronLeft aria-hidden="true" className="size-5" /></button>
                    <button type="button" aria-label={`Choose year, currently ${year}`} aria-expanded={yearPickerOpen} aria-controls="heatmap-year-picker" onClick={() => setYearPickerOpen(open => !open)} className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3">
                        <span className="sm:hidden">{period === "month" ? `${months[month]} ${year}` : `Year ${year}`}</span>
                        <span className="hidden sm:inline">{period === "month" ? `${fullMonths[month]} ${year}` : `Year ${year}`}</span>
                        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-muted-foreground transition-transform ${yearPickerOpen ? "rotate-180" : ""}`} />
                    </button>
                    <button type="button" aria-label={period === "month" ? "Next month" : "Next year"} disabled={period === "month" ? latestYear && month >= Number(today.slice(5, 7)) - 1 : latestYear} onClick={() => period === "month" ? changeMonth(1) : changeYear(1)} className="grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronRight aria-hidden="true" className="size-5" /></button>
                </div>
            </div>

                {yearPickerOpen ? <div id="heatmap-year-picker" ref={yearListRef} role="group" aria-label="Choose a year" className="grid max-h-80 grid-cols-3 gap-1.5 overflow-y-auto overscroll-contain py-1 sm:gap-2">
                    {yearOptions.map(option => <button key={option} ref={option === year ? selectedYearRef : undefined} type="button" aria-pressed={option === year} onClick={() => selectYear(option)} className={`min-h-14 rounded-full px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${option === year ? "bg-primary font-semibold text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
                        {option}
                    </button>)}
                </div> : period === "year" ? <>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:hidden">
                        {months.map((name, monthIndex) => <section key={name} aria-label={name} className="min-w-0">
                            <h2 className="mb-2 text-xs font-semibold text-foreground">{name}</h2>
                            <div className="grid grid-cols-5 gap-1">
                                {Array.from({ length: 5 }, (_, weekIndex) => {
                                    const range = monthWeekRange(year, monthIndex, weekIndex, today)
                                    if (!range) return <span key={weekIndex} aria-hidden="true" className="aspect-square rounded-lg bg-muted/30" />
                                    const matches = entries.filter(entry => entry.date >= range.start && entry.date <= range.end && entry.date <= today)
                                    return <MoodCell key={weekIndex} range={range} entries={matches} today={today} onSelect={setSelectedRange} selected={isSelected(range)} />
                                })}
                            </div>
                        </section>)}
                    </div>
                    <div className="hidden space-y-2 sm:block">
                        <div className="grid grid-cols-[3.5rem_repeat(12,minmax(0,1fr))] gap-x-1.5 text-center text-xs font-medium text-muted-foreground">
                            <span />{months.map(name => <span key={name}>{name}</span>)}
                        </div>
                        {Array.from({ length: 5 }, (_, weekIndex) => <div key={weekIndex} className="grid grid-cols-[3.5rem_repeat(12,minmax(0,1fr))] items-center gap-x-1.5">
                            <span className="whitespace-nowrap text-[10px] text-muted-foreground">{weekIndex === 4 ? "29–31" : `${weekIndex * 7 + 1}–${weekIndex * 7 + 7}`}</span>
                            {months.map((_, monthIndex) => {
                                const range = monthWeekRange(year, monthIndex, weekIndex, today)
                                if (!range) return <span key={monthIndex} aria-hidden="true" className="aspect-square rounded-lg" />
                                const matches = entries.filter(entry => entry.date >= range.start && entry.date <= range.end && entry.date <= today)
                                return <MoodCell key={monthIndex} range={range} entries={matches} today={today} onSelect={setSelectedRange} selected={isSelected(range)} />
                            })}
                        </div>)}
                    </div>
                </> : <div className="mx-auto max-w-2xl">
                    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:gap-2 sm:text-xs">
                        {weekdays.map(day => <span key={day} className="py-1">{day}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {monthCells.map((day, index) => {
                            if (!day) return <span key={`blank-${index}`} aria-hidden="true" className="aspect-square" />
                            const key = dayKey(year, month, day)
                            return <MoodCell key={key} range={{ start: key, end: key }} entries={entryOn(key)} today={today} onSelect={setSelectedRange} selected={isSelected({ start: key, end: key })} monthCell dayNumber={day} />
                        })}
                    </div>
                </div>}
            {selectedRange && <section aria-live="polite" aria-labelledby="selected-period-heading" className="mt-5 border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h2 id="selected-period-heading" className="text-sm font-semibold text-foreground sm:text-base">{formatRange(selectedRange)}</h2>
                    <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                        {selectedEntries.length} check-in{selectedEntries.length === 1 ? "" : "s"}
                    </span>
                </div>
                {selectedEntries.length ? <ul className="mt-2 divide-y divide-border/70">
                    {selectedEntries.map((entry, index) => <li key={`${entry.date}-${entry.mood}-${index}`} className="flex min-h-12 items-center gap-3 py-2.5">
                        <MoodIcon mood={entry.mood} variant="mobile" className="size-8 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                                {selectedRange.start === selectedRange.end ? moodLabels[entry.mood] : formatDay(entry.date, { weekday: "short", month: "short", day: "numeric" })}
                            </p>
                            {selectedRange.start !== selectedRange.end && <p className="text-xs text-muted-foreground">{moodLabels[entry.mood]}</p>}
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">{entry.rank}/5</span>
                    </li>)}
                </ul> : <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">No check-ins recorded for this period.</p>}
            </section>}
        </ChartCard2>
    </section>
}
