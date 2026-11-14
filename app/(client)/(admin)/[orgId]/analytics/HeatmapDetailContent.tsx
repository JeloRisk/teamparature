"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import MoodIcon from "@/app/components/MoodIcon";
import { heatmapMoods, type HeatmapDay, type HeatmapMood } from "@/lib/mood-heatmap";
import { moodColors } from "./heatmap-colors";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";

interface CheckInItem {
    id: string;
    mood: HeatmapMood;
    date: string;
}

export interface HeatmapDateRange {
    start: string;
    end: string;
}

function dateKeyToUtcDate(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(dateKey: string, includeYear = false) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        ...(includeYear ? { year: "numeric" } : {}),
        timeZone: "UTC",
    }).format(dateKeyToUtcDate(dateKey));
}

export function formatHeatmapRange({ start, end }: HeatmapDateRange) {
    if (start === end) return formatDateKey(start, true);
    const sameYear = start.slice(0, 4) === end.slice(0, 4);
    return sameYear
        ? `${formatDateKey(start)} – ${formatDateKey(end, true)}`
        : `${formatDateKey(start, true)} – ${formatDateKey(end, true)}`;
}

function dateKeysBetween(start: string, end: string) {
    const keys: string[] = [];
    const cursor = dateKeyToUtcDate(start);
    const last = dateKeyToUtcDate(end).getTime();
    while (cursor.getTime() <= last) {
        keys.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return keys;
}

function shiftDateKey(dateKey: string, days: number) {
    const date = dateKeyToUtcDate(dateKey);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function weekRangeForDate(dateKey: string, earliest: string, latest: string): HeatmapDateRange {
    const start = dateKeyToUtcDate(dateKey);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const startKey = start.toISOString().slice(0, 10);
    const endKey = end.toISOString().slice(0, 10);
    return {
        start: startKey < earliest ? earliest : startKey,
        end: endKey > latest ? latest : endKey,
    };
}

function dateCounts(counts: Partial<Record<HeatmapMood, number>> = {}) {
    return Object.fromEntries(heatmapMoods.map(mood => [mood, counts[mood] ?? 0])) as Record<HeatmapMood, number>;
}

export function HeatmapDetailContent({ orgId, timezone, start, end, days, latestDate, loading = false, error, onRetry, onRangeChange, mobileHeader }: HeatmapDateRange & {
    orgId: string;
    timezone: string;
    days: HeatmapDay[];
    latestDate: string;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onRangeChange?: (range: HeatmapDateRange) => void;
    mobileHeader?: ReactNode;
}) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
    const [checkInsLoading, setCheckInsLoading] = useState(false);
    const [checkInsError, setCheckInsError] = useState<string | null>(null);
    const [checkInsRetry, setCheckInsRetry] = useState(0);
    const [periodView, setPeriodView] = useState<"day" | "week">(start === end ? "day" : "week");
    const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [yearPickerOpen, setYearPickerOpen] = useState(false);
    const selectedYearButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (yearPickerOpen) selectedYearButton.current?.scrollIntoView({ block: "center" });
    }, [yearPickerOpen]);
    const [draftDate, setDraftDate] = useState(start);
    const [visibleMonth, setVisibleMonth] = useState(() => dateKeyToUtcDate(start));
    const calendarBody = useRef<HTMLDivElement>(null);
    const swipeStart = useRef<{ x: number; y: number } | null>(null);
    const suppressDateClick = useRef(false);
    const slideDirection = useRef(0);
    const resultsBody = useRef<HTMLDivElement>(null);
    const resultsSwipe = useRef<{ x: number; y: number } | null>(null);
    const suppressResultClick = useRef(false);
    const resultsDirection = useRef(0);
    useEffect(() => {
        const direction = resultsDirection.current;
        resultsDirection.current = 0;
        if (!direction || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        resultsBody.current?.animate([
            { transform: `translateX(${direction * 12}%)`, opacity: 0.4 },
            { transform: "translateX(0)", opacity: 1 },
        ], { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    }, [start, end]);
    useEffect(() => {
        if (!slideDirection.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        calendarBody.current?.animate([
            { transform: `translateX(${slideDirection.current * 35}%)`, opacity: 0.35 },
            { transform: "translateX(0)", opacity: 1 },
        ], { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
        slideDirection.current = 0;
    }, [visibleMonth]);
    useEffect(() => {
        setSelectedDate(null);
    }, [start, end]);
    useEffect(() => {
        const activeDate = selectedDate ?? (start === end ? start : null);
        if (!activeDate) {
            setCheckIns([]);
            setCheckInsLoading(false);
            setCheckInsError(null);
            return;
        }
        const controller = new AbortController();
        setCheckIns([]);
        setCheckInsLoading(true);
        setCheckInsError(null);
        fetch(`/api/orgs/${orgId}/moods/analytics/check-ins?date=${activeDate}`, { signal: controller.signal })
            .then(async response => {
                const body = await response.json() as { checkIns?: CheckInItem[]; error?: string };
                if (!response.ok) throw new Error(body.error || "Could not load check-ins.");
                setCheckIns(body.checkIns ?? []);
            })
            .catch((reason: unknown) => {
                if (!controller.signal.aborted) setCheckInsError(reason instanceof Error ? reason.message : "Could not load check-ins.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setCheckInsLoading(false);
            });
        return () => controller.abort();
    }, [checkInsRetry, end, orgId, selectedDate, start]);
    const daily = useMemo(() => {
        const rowsByDate = new Map(days.map(day => [day.date, day] as const));
        return dateKeysBetween(start, end).map(date => {
            const row = rowsByDate.get(date);
            return { date, total: row?.total ?? 0, counts: dateCounts(row?.counts) };
        });
    }, [days, end, start]);
    const totals = dateCounts();
    let total = 0;
    for (const day of daily) {
        total += day.total;
        for (const mood of heatmapMoods) totals[mood] += day.counts[mood];
    }
    const activeMoods = heatmapMoods.filter(mood => totals[mood] > 0);
    const moodTotal = activeMoods.reduce((sum, mood) => sum + totals[mood], 0);
    const maxMoodCount = Math.max(0, ...activeMoods.map(mood => totals[mood]));
    const maxDayTotal = Math.max(1, ...daily.map(day => day.total));
    const activeDate = selectedDate ?? (start === end ? start : null);
    const selectedDay = activeDate ? daily.find(day => day.date === activeDate) : undefined;
    const breakdownCounts = selectedDay?.counts ?? totals;
    const breakdownTotal = selectedDay?.total ?? total;
    const breakdownMoods = heatmapMoods.filter(mood => breakdownCounts[mood] > 0);
    const earliestAvailableDate = "2000-01-01";
    const latestAvailableDate = latestDate;
    const visibleMonthKey = visibleMonth.toISOString().slice(0, 7);
    const monthStartKey = `${visibleMonthKey}-01`;
    const monthStart = dateKeyToUtcDate(monthStartKey);
    const calendarDays = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + 1, 0)).getUTCDate();
    const calendarCells: Array<string | null> = [
        ...Array.from({ length: monthStart.getUTCDay() }, () => null),
        ...Array.from({ length: calendarDays }, (_, index) => `${visibleMonthKey}-${String(index + 1).padStart(2, "0")}`),
    ];
    while (calendarCells.length < 42) calendarCells.push(null);
    const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(visibleMonth);
    const lastAvailableYear = Number(latestAvailableDate.slice(0, 4));
    const availableYears = Array.from({ length: lastAvailableYear - 1999 }, (_, index) => 2000 + index);
    const visibleMonthName = new Intl.DateTimeFormat(undefined, { month: "long", timeZone: "UTC" }).format(visibleMonth);
    const previousMonthKey = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
    const nextMonthKey = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + 1, 1)).toISOString().slice(0, 7);
    const canShowPreviousMonth = previousMonthKey >= "2000-01";
    const canShowNextMonth = nextMonthKey <= latestAvailableDate.slice(0, 7);
    function moveCalendarMonth(direction: -1 | 1) {
        if (direction < 0 ? !canShowPreviousMonth : !canShowNextMonth) return;
        slideDirection.current = direction;
        setVisibleMonth(dateKeyToUtcDate(`${direction < 0 ? previousMonthKey : nextMonthKey}-01`));
    }
    const selectedWeek = periodView === "week" ? weekRangeForDate(draftDate, earliestAvailableDate, latestAvailableDate) : null;
    const previousPeriod = periodView === "day"
        ? { start: shiftDateKey(start, -1), end: shiftDateKey(start, -1) }
        : weekRangeForDate(shiftDateKey(start, -7), earliestAvailableDate, latestAvailableDate);
    const nextPeriod = periodView === "day"
        ? { start: shiftDateKey(start, 1), end: shiftDateKey(start, 1) }
        : weekRangeForDate(shiftDateKey(start, 7), earliestAvailableDate, latestAvailableDate);
    const canGoPrevious = previousPeriod.end >= earliestAvailableDate && previousPeriod.start < start;
    const canGoNext = nextPeriod.start <= latestAvailableDate && nextPeriod.start > start;
    const checkInTimeFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
    }), [timezone]);

    function openDatePicker() {
        setYearPickerOpen(false);
        setPeriodMenuOpen(false);
        setDraftDate(start);
        setVisibleMonth(dateKeyToUtcDate(start));
        setDatePickerOpen(true);
    }

    function handlePeriodMenuChange(value: string) {
        setPeriodMenuOpen(false);
        if (value === "change-date") {
            openDatePicker();
            return;
        }
        changePeriodView(value as "day" | "week");
    }

    function applyDateSelection() {
        if (draftDate < earliestAvailableDate || draftDate > latestAvailableDate) return;
        const range = periodView === "day"
            ? { start: draftDate, end: draftDate }
            : weekRangeForDate(draftDate, earliestAvailableDate, latestAvailableDate);
        onRangeChange?.(range);
        setDatePickerOpen(false);
    }

    function changePeriodView(nextView: "day" | "week") {
        setPeriodView(nextView);
        const range = nextView === "day"
            ? { start, end: start }
            : weekRangeForDate(start, earliestAvailableDate, latestAvailableDate);
        onRangeChange?.(range);
    }

    function movePeriod(direction: -1 | 1) {
        const range = direction < 0 ? previousPeriod : nextPeriod;
        if (direction < 0 ? !canGoPrevious : !canGoNext) return;
        resultsDirection.current = direction;
        onRangeChange?.(range);
    }

    if (loading) return <div role="status" aria-label="Loading date details" className="space-y-4">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        <div className="h-52 animate-pulse rounded-2xl bg-muted" />
        <span className="sr-only">Loading check-in details</span>
    </div>;

    if (error) return <div role="alert" className="rounded-2xl border border-border bg-muted/50 p-5 text-sm">
        <p className="font-semibold text-foreground">We couldn’t load this date range.</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-4 min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Try again</button>}
    </div>;

    return <div className="space-y-4">
        <div className={mobileHeader ? "sticky top-0 z-20 -mx-4 bg-background sm:static sm:mx-0" : ""}>
        {mobileHeader}
        <div className="relative grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center border-b border-border/70 bg-background sm:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem_auto] sm:gap-3 sm:rounded-2xl sm:border sm:border-border/80 sm:bg-card sm:px-3 sm:py-2.5">
            <button type="button" aria-label={`Previous ${periodView}`} disabled={!canGoPrevious} onClick={() => movePeriod(-1)} className="row-span-2 grid h-16 w-full place-items-center self-center border-r border-border/70 text-foreground transition-colors hover:bg-muted/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring sm:col-start-1 sm:row-span-1 sm:row-start-1 sm:size-11 sm:rounded-full sm:border-0 sm:bg-muted/65 sm:hover:bg-primary/10 sm:focus-visible:outline-offset-2">
                <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button type="button" aria-haspopup="true" aria-expanded={periodMenuOpen} aria-controls="heatmap-period-menu" aria-label={`${periodView === "day" ? "Day view" : "Week view"}, ${formatHeatmapRange({ start, end })}. Open period options`} onClick={() => setPeriodMenuOpen(open => !open)} className="col-start-2 row-start-1 row-span-2 flex h-20 min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-center text-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:row-span-1 sm:h-12 sm:flex-row sm:gap-2.5 sm:rounded-xl sm:px-2 sm:hover:bg-primary/[0.045] sm:focus-visible:outline-offset-2">
                <span className="flex items-center gap-1.5 text-sm font-medium sm:hidden">{periodView === "day" ? "Day View" : "Week View"}<ChevronDown aria-hidden="true" className={`size-4 text-muted-foreground transition-transform ${periodMenuOpen ? "rotate-180" : ""}`} /></span>
                <span aria-hidden="true" className="hidden size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary sm:grid"><CalendarDays className="size-4" /></span>
                <span className="truncate text-sm font-medium tabular-nums sm:text-lg sm:font-semibold">{formatHeatmapRange({ start, end })}</span>
            </button>
            <button type="button" aria-label={`Next ${periodView}`} disabled={!canGoNext} onClick={() => movePeriod(1)} className="col-start-3 row-span-2 row-start-1 grid h-16 w-full place-items-center self-center border-l border-border/70 text-foreground transition-colors hover:bg-muted/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring sm:row-span-1 sm:size-11 sm:rounded-full sm:border-0 sm:bg-muted/65 sm:hover:bg-primary/10 sm:focus-visible:outline-offset-2">
                <ChevronRight aria-hidden="true" className="size-5" />
            </button>
            <div className="relative col-start-4 row-start-1 hidden justify-end sm:flex">
                <label className="sr-only" htmlFor="heatmap-detail-period-view-desktop">Detail period</label>
                <select id="heatmap-detail-period-view-desktop" value={periodView} onChange={event => handlePeriodMenuChange(event.target.value)} className="h-11 w-40 appearance-none rounded-xl border border-border bg-background pl-3 pr-8 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    <option value="day">Day view</option>
                    <option value="week">Week view</option>
                    <option value="change-date">Change date</option>
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
        {periodMenuOpen && <>
            <button type="button" aria-label="Close period menu" onClick={() => setPeriodMenuOpen(false)} className="fixed inset-0 z-10 cursor-default bg-transparent sm:hidden" />
            <div id="heatmap-period-menu" aria-label="Choose detail period" className="absolute left-0 right-0 top-full z-30 border-t border-border/70 bg-card shadow-lg sm:hidden">
                <button type="button" onClick={() => handlePeriodMenuChange("day")} className="flex min-h-14 w-full items-center justify-center border-b border-border/70 px-5 text-base text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ring">Day</button>
                <button type="button" onClick={() => handlePeriodMenuChange("week")} className="flex min-h-14 w-full items-center justify-center border-b border-border/70 px-5 text-base text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ring">Week</button>
                <button type="button" onClick={() => handlePeriodMenuChange("change-date")} className="flex min-h-14 w-full items-center justify-center px-5 text-base text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ring">Change date…</button>
            </div>
        </>}
        </div>
        </div>

        <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <DialogContent showCloseButton={false} aria-describedby="heatmap-date-picker-description" overlayClassName="z-[110]" className="z-[111] w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden rounded-[28px] p-0">
                <DialogTitle className="sr-only">{periodView === "day" ? "Choose a date" : "Choose a week"}</DialogTitle>
                <DialogDescription id="heatmap-date-picker-description" className="sr-only">{periodView === "day" ? "Choose one date to view its mood check-ins." : "Choose one date to select its full Sunday–Saturday week."}</DialogDescription>
                <div className="space-y-3 px-3 py-4 sm:px-5">
                    <div className="flex items-center justify-between gap-2">
                        <button type="button" aria-expanded={yearPickerOpen} aria-controls="heatmap-year-grid" onClick={() => setYearPickerOpen(open => !open)} className="flex min-h-10 items-center gap-2 border-0 bg-transparent px-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                            {visibleMonthName} {visibleMonth.getUTCFullYear()}
                            <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${yearPickerOpen ? "rotate-180" : ""}`} />
                        </button>
                        <div className={`flex items-center gap-1 ${yearPickerOpen ? "invisible" : ""}`}>
                            <button type="button" aria-label="Previous month" disabled={!canShowPreviousMonth} onClick={() => moveCalendarMonth(-1)} className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                                <ChevronLeft aria-hidden="true" className="size-5" />
                            </button>
                            <button type="button" aria-label="Next month" disabled={!canShowNextMonth} onClick={() => moveCalendarMonth(1)} className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                                <ChevronRight aria-hidden="true" className="size-5" />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                    {yearPickerOpen && <div id="heatmap-year-grid" aria-label="Choose year" className="absolute inset-0 z-10 overflow-y-auto bg-background p-2">
                        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                            {availableYears.map(year => <button key={year} ref={year === visibleMonth.getUTCFullYear() ? selectedYearButton : undefined} type="button" aria-pressed={year === visibleMonth.getUTCFullYear()} onClick={() => {
                                const latestMonth = year === lastAvailableYear ? Number(latestAvailableDate.slice(5, 7)) - 1 : 11;
                                setVisibleMonth(dateKeyToUtcDate(`${year}-${String(Math.min(visibleMonth.getUTCMonth(), latestMonth) + 1).padStart(2, "0")}-01`));
                                setYearPickerOpen(false);
                            }} className={`min-h-12 rounded-full px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${year === visibleMonth.getUTCFullYear() ? "bg-primary font-semibold text-primary-foreground" : "text-foreground hover:bg-muted"}`}>{year}</button>)}
                        </div>
                    </div>}
                    <div inert={yearPickerOpen} className={`overflow-hidden ${yearPickerOpen ? "invisible" : ""}`} style={{ touchAction: "pan-y" }} onTouchStart={event => {
                        const touch = event.touches[0];
                        swipeStart.current = { x: touch.clientX, y: touch.clientY };
                        suppressDateClick.current = false;
                    }} onTouchMove={event => {
                        if (!swipeStart.current) return;
                        const touch = event.touches[0];
                        const dx = touch.clientX - swipeStart.current.x;
                        const dy = touch.clientY - swipeStart.current.y;
                        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) suppressDateClick.current = true;
                    }} onTouchCancel={() => { swipeStart.current = null; }} onTouchEnd={event => {
                        if (!swipeStart.current) return;
                        const touch = event.changedTouches[0];
                        const dx = touch.clientX - swipeStart.current.x;
                        const dy = touch.clientY - swipeStart.current.y;
                        swipeStart.current = null;
                        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) moveCalendarMonth(dx < 0 ? 1 : -1);
                    }} onClickCapture={event => {
                        if (suppressDateClick.current) {
                            event.preventDefault();
                            event.stopPropagation();
                            suppressDateClick.current = false;
                        }
                    }}>
                    <div ref={calendarBody} role="grid" aria-label={monthLabel} className="grid grid-cols-7 gap-1 text-center">
                        {["S", "M", "T", "W", "T", "F", "S"].map((weekday, index) => <div key={index} role="columnheader" aria-label={new Intl.DateTimeFormat(undefined, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + index)))} className="grid h-9 place-items-center text-xs font-medium text-muted-foreground">{weekday}</div>)}
                        {calendarCells.map((date, index) => {
                            if (!date) return <div key={`blank-${index}`} aria-hidden="true" className="aspect-square min-h-10 min-w-0" />;
                            const unavailable = date < earliestAvailableDate || date > latestAvailableDate;
                            const isSelectedDate = date === draftDate;
                            const isInSelectedWeek = Boolean(selectedWeek && date >= selectedWeek.start && date <= selectedWeek.end);
                            const isWeekEndpoint = Boolean(selectedWeek && (date === selectedWeek.start || date === selectedWeek.end));
                            const isToday = date === latestAvailableDate && latestAvailableDate.slice(5) !== "12-31";
                            const dateClass = unavailable
                                ? "text-muted-foreground/35"
                                : isSelectedDate && periodView === "day" || isWeekEndpoint
                                    ? "bg-primary font-semibold text-primary-foreground hover:bg-primary"
                                    : isInSelectedWeek
                                        ? "rounded-none bg-primary/10 text-foreground hover:bg-primary/20"
                                        : "text-foreground hover:bg-muted";
                            return <button key={date} type="button" role="gridcell" disabled={unavailable} aria-current={isToday ? "date" : undefined} aria-pressed={isSelectedDate} aria-label={formatDateKey(date, true)} onClick={() => setDraftDate(date)} className={`grid aspect-square min-h-10 min-w-0 place-items-center rounded-full text-sm tabular-nums transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed ${dateClass} ${isToday && !isSelectedDate && !isWeekEndpoint ? "ring-1 ring-inset ring-primary" : ""}`}>
                                {dateKeyToUtcDate(date).getUTCDate()}
                            </button>;
                        })}
                    </div>
                    </div>
                </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-border/70 bg-background px-4 py-3 sm:px-5 sm:py-4">
                    <button type="button" onClick={() => setDatePickerOpen(false)} className="min-h-10 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Cancel</button>
                    <button type="button" disabled={draftDate < earliestAvailableDate || draftDate > latestAvailableDate} onClick={applyDateSelection} className="min-h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">OK</button>
                </div>
            </DialogContent>
        </Dialog>

        <div className="overflow-hidden" style={{ touchAction: "pan-y" }} onTouchStart={event => {
            const touch = event.touches[0];
            resultsSwipe.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
            suppressResultClick.current = false;
        }} onTouchMove={event => {
            if (!resultsSwipe.current) return;
            const touch = event.touches[0];
            const dx = touch.clientX - resultsSwipe.current.x;
            const dy = touch.clientY - resultsSwipe.current.y;
            if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.5) suppressResultClick.current = true;
        }} onTouchCancel={() => { resultsSwipe.current = null; }} onTouchEnd={event => {
            if (!resultsSwipe.current) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - resultsSwipe.current.x;
            const dy = touch.clientY - resultsSwipe.current.y;
            resultsSwipe.current = null;
            if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) movePeriod(dx < 0 ? 1 : -1);
        }} onClickCapture={event => {
            if (suppressResultClick.current) {
                event.preventDefault();
                event.stopPropagation();
                suppressResultClick.current = false;
            }
        }}>
        <div ref={resultsBody} className="space-y-4">
        <article className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total check-ins</h3>
            <p className="mt-3 text-4xl font-semibold leading-none tracking-tight tabular-nums text-foreground">{total.toLocaleString()}</p>
            <p className="mt-2 text-xs text-muted-foreground">Across {daily.length} {daily.length === 1 ? "day" : "days"}</p>
            {moodTotal > 0 ? <div aria-label={`Mood distribution across ${moodTotal} check-ins`} role="img" className="mt-5 flex h-16 w-full items-center gap-1.5">
                {activeMoods.map(mood => <span key={mood} title={`${mood}: ${totals[mood]} ${totals[mood] === 1 ? "check-in" : "check-ins"}`} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl ${totals[mood] === maxMoodCount ? "h-16" : "h-14"}`} style={{ flexGrow: totals[mood], flexBasis: 0, backgroundColor: moodColors[mood] }}>
                    <MoodIcon mood={mood} className="size-7 shrink-0 sm:size-8" variant="mobile" />
                </span>)}
            </div> : <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">No check-ins were recorded for this date range.</p>}
        </article>

        {daily.length > 1 && total > 0 && <section aria-labelledby="heatmap-daily-activity" className="rounded-2xl border border-border bg-card p-5">
            <div>
                <h3 id="heatmap-daily-activity" className="text-sm font-semibold text-foreground">Daily check-ins</h3>
                <p className="mt-1 text-xs text-muted-foreground">Select a day to filter the breakdown.</p>
            </div>
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(2.25rem,1fr))] items-end gap-2">
                {daily.map(day => <button key={day.date} type="button" aria-label={`Show all moods on ${formatDateKey(day.date, true)} (${day.total} ${day.total === 1 ? "check-in" : "check-ins"})`} aria-pressed={selectedDate === day.date} onClick={() => setSelectedDate(day.date)} className="min-w-0 rounded-lg p-1 text-center hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-pressed:bg-primary/5 aria-pressed:ring-2 aria-pressed:ring-primary">
                    <span className="mb-1 block h-4 text-[10px] tabular-nums text-muted-foreground">{day.total || ""}</span>
                    <div className="mx-auto flex h-28 w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md bg-muted/60">
                        {[...heatmapMoods].reverse().map(mood => day.counts[mood] > 0 && <span key={mood} title={`${mood}: ${day.counts[mood]} ${day.counts[mood] === 1 ? "check-in" : "check-ins"}`} className="block min-h-[3px] w-full shrink-0" style={{ height: `${day.counts[mood] / maxDayTotal * 100}%`, backgroundColor: moodColors[mood] }} />)}
                    </div>
                    <span className="mt-1 block min-h-9 truncate px-1 text-[10px] tabular-nums text-muted-foreground">{dateKeyToUtcDate(day.date).getUTCDate()}</span>
                </button>)}
            </div>
        </section>}

        {activeMoods.length > 0 && <section aria-labelledby="heatmap-mood-breakdown" className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 id="heatmap-mood-breakdown" className="text-sm font-semibold text-foreground">Mood breakdown</h3>
                    {selectedDay && <p className="mt-1 truncate text-xs text-muted-foreground">{formatDateKey(selectedDay.date, true)}</p>}
                </div>
                {selectedDate && <button type="button" onClick={() => setSelectedDate(null)} className="min-h-9 shrink-0 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Clear selection</button>}
            </div>
            {breakdownMoods.length > 0 ? <ul className="mt-3 divide-y divide-border/70">
                {breakdownMoods.map(mood => {
                    const count = breakdownCounts[mood];
                    const share = breakdownTotal ? Math.round(count / breakdownTotal * 100) : 0;
                    return <li key={mood} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-3">
                        <MoodIcon mood={mood} className="size-7 shrink-0" variant="mobile" />
                        <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium capitalize text-foreground">{mood}</span>
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count} {count === 1 ? "check-in" : "check-ins"} · {share}%</span>
                            </div>
                            <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary/30" style={{ width: `${share}%` }} /></div>
                        </div>
                    </li>;
                })}
            </ul> : <p className="mt-4 rounded-xl bg-muted/60 px-3 py-3 text-sm text-muted-foreground">No check-ins were recorded on {selectedDay ? formatDateKey(selectedDay.date, true) : "this date"}.</p>}
        </section>}

        {selectedDay && <section aria-labelledby="heatmap-check-in-activity" className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
                <h3 id="heatmap-check-in-activity" className="text-sm font-semibold text-foreground">Check-in activity</h3>
                <span className="text-xs tabular-nums text-muted-foreground">{selectedDay.total} {selectedDay.total === 1 ? "check-in" : "check-ins"}</span>
            </div>
            {checkInsLoading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading check-ins…</p>
                : checkInsError ? <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-3 text-sm">
                    <span className="text-muted-foreground">{checkInsError}</span>
                    <button type="button" onClick={() => setCheckInsRetry(value => value + 1)} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Try again</button>
                </div>
                    : checkIns.length > 0 ? <ul className="mt-2 divide-y divide-border/70">
                        {checkIns.map(checkIn => <li key={checkIn.id} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                            <span aria-label="Anonymous member" className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"><UserRound aria-hidden="true" className="size-4" /></span>
                            <MoodIcon mood={checkIn.mood} className="size-7 shrink-0" variant="mobile" />
                            <span className="min-w-0 truncate text-sm font-medium capitalize text-foreground">{checkIn.mood}</span>
                            <time dateTime={checkIn.date} className="text-xs tabular-nums text-muted-foreground">{checkInTimeFormatter.format(new Date(checkIn.date))}</time>
                        </li>)}
                    </ul> : <p className="mt-4 rounded-xl bg-muted/60 px-3 py-3 text-sm text-muted-foreground">No check-ins were recorded on {formatDateKey(selectedDay.date, true)}.</p>}
        </section>}
        </div>
        </div>
    </div>;
}
