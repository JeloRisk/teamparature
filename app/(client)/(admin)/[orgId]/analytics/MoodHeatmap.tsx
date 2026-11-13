"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ChartCard2 from "./components/analytics/ChartCard2";
import MoodIcon from "@/app/components/MoodIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { leadingMoods, heatmapMoods, type HeatmapCell, type HeatmapDay, type HeatmapMood } from "@/lib/mood-heatmap";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { HeatmapDetailContent, formatHeatmapRange, type HeatmapDateRange } from "./HeatmapDetailContent";
import { moodColors } from "./heatmap-colors";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type HeatmapView = "month" | "year";

interface YearDataPoint {
    month: number;
    week: number;
    leaders: HeatmapMood[];
    counts: HeatmapCell["counts"];
    total: number;
    range: string;
    applicable: boolean;
    future: boolean;
    startDate: string | null;
    endDate: string | null;
}

function dateKeyToUtcDate(dateKey: string) {
    const parts = dateKey.split("-").map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

function formatDateKey(dateKey: string, includeYear = false) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        ...(includeYear ? { year: "numeric" } : {}),
        timeZone: "UTC",
    }).format(dateKeyToUtcDate(dateKey));
}

function groupByMonthAndWeek(cells: HeatmapCell[], year: number, asOfDate: string) {
    const cellsByMonthWeek = new Map(cells.map(cell => [cell.month + "-" + cell.week, cell] as const));
    return Array.from({ length: 5 }, (_, index) => ({
        name: index === 4 ? "29–31" : `${index * 7 + 1}–${index * 7 + 7}`,
        data: monthNames.map((_, monthIndex): YearDataPoint => {
            const week = index + 1;
            const firstDay = index * 7 + 1;
            const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
            const lastDay = Math.min(firstDay + 6, daysInMonth);
            const monthKey = year + "-" + String(monthIndex + 1).padStart(2, "0");
            const firstKey = monthKey + "-" + String(firstDay).padStart(2, "0");
            const exists = firstDay <= lastDay;
            const future = exists && firstKey > asOfDate;
            const applicable = exists && !future;
            const latestDay = applicable && asOfDate.startsWith(monthKey) ? Math.min(lastDay, Number(asOfDate.slice(-2))) : lastDay;
            const cell = cellsByMonthWeek.get((monthIndex + 1) + "-" + week);
            const firstDateKey = monthKey + "-" + String(firstDay).padStart(2, "0");
            const lastDateKey = monthKey + "-" + String(applicable ? latestDay : lastDay).padStart(2, "0");
            return {
                month: monthIndex + 1,
                week,
                leaders: leadingMoods(cell?.counts ?? {}),
                counts: cell?.counts ?? {},
                total: cell?.total ?? 0,
                range: exists ? formatDateKey(firstDateKey) + " – " + formatDateKey(lastDateKey) + ", " + year : monthNames[monthIndex] + " has no Week " + week,
                applicable,
                future,
                startDate: applicable ? firstDateKey : null,
                endDate: applicable ? lastDateKey : null,
            };
        }),
    }));
}

function MoodDayCell({ dateKey, data, asOfDate, onSelect }: {
    dateKey: string;
    data?: HeatmapDay;
    asOfDate: string;
    onSelect: (range: HeatmapDateRange) => void;
}) {
    const dayNumber = dateKeyToUtcDate(dateKey).getUTCDate();
    const future = dateKey > asOfDate;
    const leaders = leadingMoods(data?.counts ?? {});
    const mood = leaders.length > 1 ? "neutral" : leaders[0];
    const total = data?.total ?? 0;
    const label = future
        ? "Not yet occurred"
        : !total
            ? "No check-ins"
            : leaders.length > 1
                ? "Tied moods: " + leaders.join(", ")
                : mood + " was most common";
    const background = future ? "var(--muted)" : mood ? moodColors[mood] : "var(--muted)";
    const iconSize = "size-5 sm:size-7";

    return <Tooltip>
        <TooltipTrigger asChild>
            <button type="button" disabled={future} onClick={() => onSelect({ start: dateKey, end: dateKey })} aria-label={formatDateKey(dateKey, true) + ". " + label + (total ? ", " + total + " check-ins" : "")} className={"group relative z-0 grid aspect-square min-w-0 place-items-center rounded-lg p-0.5 transition-[transform,box-shadow] duration-150 hover:z-10 hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-primary/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default " + (future ? "opacity-30 border border-dashed border-border" : "cursor-pointer")} style={{ backgroundColor: background }}>
                <span className="absolute left-1 top-0.5 text-[9px] font-medium leading-none text-foreground/70 sm:left-1.5 sm:top-1 sm:text-[10px]">{dayNumber}</span>
                {mood && !future && <MoodIcon mood={mood} className={"mt-2 " + iconSize} variant="mobile" />}
            </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
            <p className="text-xs font-medium text-muted-foreground">{formatDateKey(dateKey, true)}</p>
            <p className="mt-1 font-semibold capitalize">{label}</p>
            <p className="text-xs text-muted-foreground">{total} check-in{total === 1 ? "" : "s"}</p>
            {total > 0 && <div className="mt-3 grid grid-cols-5 gap-1 border-t border-border pt-2">
                {heatmapMoods.map(name => <div key={name} className="flex flex-col items-center gap-1 text-[10px] capitalize text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: moodColors[name] }} />{data?.counts[name] ?? 0}</div>)}
            </div>}
        </TooltipContent>
    </Tooltip>;
}

function YearMoodCell({ point, onSelect }: { point: YearDataPoint; onSelect: (range: HeatmapDateRange) => void }) {
    const mood = point.leaders.length > 1 ? "neutral" : point.leaders[0];
    const background = !point.applicable ? (point.future ? "var(--muted)" : "transparent") : mood ? moodColors[mood] : "var(--muted)";
    const label = !point.applicable ? (point.future ? "Not yet occurred" : "No days in this week") : !point.total ? "No check-ins" : point.leaders.length > 1 ? "Tied moods: " + point.leaders.join(", ") : mood + " was most common";

    return <Tooltip>
        <TooltipTrigger asChild>
            <button type="button" disabled={!point.applicable || !point.startDate || !point.endDate} onClick={() => point.startDate && point.endDate && onSelect({ start: point.startDate, end: point.endDate })} aria-label={point.range + ". " + label + (point.total ? ", " + point.total + " check-ins" : "")} className={"group relative z-0 grid aspect-square min-w-0 place-items-center rounded-md transition-[transform,box-shadow] duration-150 hover:z-10 hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-primary/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default " + (point.future ? "opacity-30 border border-dashed border-border" : point.applicable ? "cursor-pointer" : "")} style={{ backgroundColor: background }}>
                {mood && point.total > 0 && <MoodIcon mood={mood} className="size-5 sm:size-8" variant="mobile" />}
            </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
            <p className="text-xs font-medium text-muted-foreground">{point.range}</p>
            <p className="mt-1 font-semibold capitalize">{label}</p>
            <p className="text-xs text-muted-foreground">{point.total} check-in{point.total === 1 ? "" : "s"}</p>
            {point.total > 0 && <div className="mt-3 grid grid-cols-5 gap-1 border-t border-border pt-2">
                {heatmapMoods.map(name => <div key={name} className="flex flex-col items-center gap-1 text-[10px] capitalize text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: moodColors[name] }} />{point.counts[name] ?? 0}</div>)}
            </div>}
        </TooltipContent>
    </Tooltip>;
}

export default function MoodHeatmap({ orgId, timezone, moods, days, year, asOfDate, latestYear, onYearChange }: {
    orgId: string;
    timezone: string;
    moods: HeatmapCell[];
    days: HeatmapDay[];
    year: number;
    asOfDate: string;
    latestYear: number;
    onYearChange: (year: number) => void;
}) {
    const [view, setView] = useState<HeatmapView>("year");
    const [selectedRange, setSelectedRange] = useState<HeatmapDateRange | null>(null);
    const [mobileRange, setMobileRange] = useState<HeatmapDateRange | null>(null);
    const [month, setMonth] = useState(() => year === latestYear ? Number(asOfDate.slice(5, 7)) - 1 : 11);
    const empty = "var(--muted)";
    const future = empty;
    const yearRows = groupByMonthAndWeek(moods, year, asOfDate);
    const yearMonths = monthNames.map((name, monthIndex) => ({
        name,
        data: yearRows.map(row => row.data[monthIndex]),
    }));
    const dayByDate = new Map(days.map(day => [day.date, day] as const));

    useEffect(() => {
        const syncMobileDetail = () => {
            const params = new URLSearchParams(window.location.search);
            const start = params.get("heatmapStart");
            const end = params.get("heatmapEnd");
            const isMobile = window.matchMedia("(max-width: 767px)").matches;
            setMobileRange(isMobile && start && end ? { start, end } : null);
        };
        window.addEventListener("popstate", syncMobileDetail);
        syncMobileDetail();
        return () => window.removeEventListener("popstate", syncMobileDetail);
    }, []);

    useEffect(() => {
        if (!mobileRange) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previousOverflow; };
    }, [mobileRange]);

    const selectRange = (range: HeatmapDateRange) => {
        if (window.matchMedia("(max-width: 767px)").matches) {
            const params = new URLSearchParams(window.location.search);
            params.set("heatmapStart", range.start);
            params.set("heatmapEnd", range.end);
            window.history.pushState({ heatmapDetail: true }, "", `${window.location.pathname}?${params.toString()}`);
            setMobileRange(range);
        } else {
            setSelectedRange(range);
        }
    };

    const closeMobileDetail = () => {
        if (window.history.state?.heatmapDetail) window.history.back();
        else {
            const params = new URLSearchParams(window.location.search);
            params.delete("heatmapStart");
            params.delete("heatmapEnd");
            const query = params.toString();
            window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
            setMobileRange(null);
        }
    };
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const monthLeadingDays = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const monthCells: (string | null)[] = [
        ...Array.from({ length: monthLeadingDays }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => year + "-" + String(month + 1).padStart(2, "0") + "-" + String(index + 1).padStart(2, "0")),
    ];
    while (monthCells.length % 7) monthCells.push(null);

    const handleYearChange = (nextYear: number) => {
        setMonth(nextYear === latestYear ? Number(asOfDate.slice(5, 7)) - 1 : 11);
        onYearChange(nextYear);
    };

    const moveMonth = (direction: -1 | 1) => {
        const nextMonth = month + direction;
        if (nextMonth < 0 && year > 2000) { onYearChange(year - 1); setMonth(11); }
        else if (nextMonth > 11 && year < latestYear) { onYearChange(year + 1); setMonth(0); }
        else if (nextMonth >= 0 && nextMonth <= 11) setMonth(nextMonth);
    };

    return <>
    <ChartCard2 title="Emotion heatmap" action={
        <div className="relative">
            <select aria-label="Heatmap year" value={year} onChange={event => handleYearChange(Number(event.target.value))} className="h-10 min-w-24 appearance-none rounded-lg border border-border bg-background pl-3 pr-10 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {Array.from({ length: latestYear - 1999 }, (_, index) => latestYear - index).map(optionYear => <option key={optionYear} value={optionYear}>{optionYear}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
    }>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Heatmap time scale" className="inline-flex rounded-xl bg-muted p-1">
                {(["month", "year"] as const).map(option => <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)} className={"min-h-10 rounded-lg px-3 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " + (view === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {option}
                </button>)}
            </div>
            {view === "month" && <div className="flex items-center gap-2">
                <button type="button" aria-label="Previous month" disabled={year === 2000 && month === 0} onClick={() => moveMonth(-1)} className="grid size-10 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronLeft aria-hidden="true" className="size-4" /></button>
                <span className="min-w-20 text-center text-sm font-medium">{monthNames[month]} {year}</span>
                <button type="button" aria-label="Next month" disabled={year === latestYear && month >= Number(asOfDate.slice(5, 7)) - 1} onClick={() => moveMonth(1)} className="grid size-10 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronRight aria-hidden="true" className="size-4" /></button>
            </div>}
        </div>

        <ul aria-label="Mood legend" className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {heatmapMoods.map(mood => <li key={mood} className="flex items-center gap-2 capitalize"><span className="size-3 rounded-sm" style={{ backgroundColor: moodColors[mood] }} />{mood}</li>)}
            <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: "#bec8ed" }} />Tied moods</li>
        </ul>

        <details className="mb-4 text-xs text-muted-foreground">
            <summary className="w-fit cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-ring">How to read this calendar</summary>
            <p className="mt-2 max-w-prose leading-relaxed">Each cell shows the most common reported mood. Ties use the neutral face. Empty cells mean no check-ins; faded cells are future dates. In Year view, each month has five cells for days 1–7, 8–14, 15–21, 22–28, and 29–31.</p>
        </details>

        <div role="region" aria-label={view.charAt(0).toUpperCase() + view.slice(1) + " mood calendar"} className="w-full min-w-0">
            {view === "year" && <div className="w-full min-w-0 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:hidden">
                    {yearMonths.map(monthData => <section key={monthData.name} aria-label={monthData.name} className="min-w-0">
                        <h3 className="mb-2 text-xs font-semibold text-foreground">{monthData.name}</h3>
                        <div className="grid grid-cols-5 gap-1">
                            {monthData.data.map(point => <YearMoodCell key={point.week} point={point} onSelect={selectRange} />)}
                        </div>
                    </section>)}
                </div>
                <div className="hidden sm:block space-y-2">
                <div className="grid grid-cols-[3.5rem_repeat(12,minmax(0,1fr))] gap-x-1.5 text-center text-xs font-medium leading-4 text-muted-foreground">
                    <span />{monthNames.map(monthName => <span key={monthName}>{monthName}</span>)}
                </div>
                {yearRows.map(week => <div key={week.name} className="grid grid-cols-[3.5rem_repeat(12,minmax(0,1fr))] items-center gap-x-1.5">
                    <span className="whitespace-nowrap text-[9px] text-muted-foreground sm:text-xs">
                        {week.name}
                    </span>
                    {week.data.map(point => {
                        const mood = point.leaders.length > 1 ? "neutral" : point.leaders[0];
                        const background = !point.applicable ? (point.future ? future : "transparent") : mood ? moodColors[mood] : empty;
                        const label = !point.applicable ? (point.future ? "Not yet occurred" : "No days in this week") : !point.total ? "No check-ins" : point.leaders.length > 1 ? "Tied moods: " + point.leaders.join(", ") : mood + " was most common";
                        return <Tooltip key={point.month + "-" + point.week}>
                            <TooltipTrigger asChild>
                                <button type="button" disabled={!point.applicable || !point.startDate || !point.endDate} onClick={() => point.startDate && point.endDate && selectRange({ start: point.startDate, end: point.endDate })} aria-label={point.range + ". " + label + (point.total ? ", " + point.total + " check-ins" : "")} className={"group relative z-0 grid aspect-square min-w-0 place-items-center rounded-md transition-[transform,box-shadow] duration-150 hover:z-10 hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-primary/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default " + (point.future ? "opacity-30 border border-dashed border-border" : point.applicable ? "cursor-pointer" : "")} style={{ backgroundColor: background }}>
                                    {mood && point.total > 0 && <MoodIcon mood={mood} className="size-5 sm:size-8" variant="mobile" />}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
                                <p className="text-xs font-medium text-muted-foreground">{point.range}</p>
                                <p className="mt-1 font-semibold capitalize">{label}</p>
                                <p className="text-xs text-muted-foreground">{point.total} check-in{point.total === 1 ? "" : "s"}</p>
                                {point.total > 0 && <div className="mt-3 grid grid-cols-5 gap-1 border-t border-border pt-2">
                                    {heatmapMoods.map(name => <div key={name} className="flex flex-col items-center gap-1 text-[10px] capitalize text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: moodColors[name] }} />{point.counts[name] ?? 0}</div>)}
                                </div>}
                            </TooltipContent>
                        </Tooltip>;
                    })}
                </div>)}
                </div>
            </div>}

            {view === "month" && <div className="mx-auto max-w-2xl">
                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:gap-2 sm:text-xs">
                    {weekdays.map(day => <span key={day} className="py-1">{day}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {monthCells.map((dateKey, index) => dateKey
                        ? <MoodDayCell key={dateKey} dateKey={dateKey} data={dayByDate.get(dateKey)} asOfDate={asOfDate} onSelect={selectRange} />
                        : <div key={"blank-" + index} aria-hidden="true" className="aspect-square" />)}
                </div>
            </div>}

        </div>
    </ChartCard2>
        <Dialog open={Boolean(selectedRange)} onOpenChange={open => { if (!open) setSelectedRange(null); }}>
            {selectedRange && <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-3xl" closeButtonClassName="top-3 right-3 size-10 rounded-xl border border-border bg-background text-foreground opacity-100 hover:bg-muted" aria-describedby="heatmap-detail-description">
                <DialogHeader className="shrink-0 gap-1 border-b border-border/70 bg-background px-5 pt-5 pb-4 pr-16 text-left sm:px-6 sm:pt-6 sm:pb-4">
                    <DialogTitle className="text-xl leading-6">{formatHeatmapRange(selectedRange)}</DialogTitle>
                    <DialogDescription id="heatmap-detail-description" className="sr-only">Mood check-ins by day and mood.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6">
                    <HeatmapDetailContent orgId={orgId} timezone={timezone} start={selectedRange.start} end={selectedRange.end} days={days} />
                </div>
            </DialogContent>}
        </Dialog>
        {mobileRange && <main className="fixed inset-0 z-[100] overflow-y-auto bg-background pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] text-foreground md:hidden">
            <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
                <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 border-b border-border/70 bg-background px-4 py-3 sm:-mx-6 sm:px-6">
                    <button type="button" onClick={closeMobileDetail} aria-label="Back to emotion heatmap" className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        <ArrowLeft aria-hidden="true" className="size-5" />
                    </button>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Emotion heatmap</p>
                        <h1 className="mt-1 truncate text-xl font-semibold leading-6">{formatHeatmapRange(mobileRange)}</h1>
                    </div>
                </header>
                <HeatmapDetailContent orgId={orgId} timezone={timezone} start={mobileRange.start} end={mobileRange.end} days={days} />
            </div>
        </main>}
        </>;
}
