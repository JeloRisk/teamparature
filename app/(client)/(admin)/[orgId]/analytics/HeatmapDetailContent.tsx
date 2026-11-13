"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import MoodIcon from "@/app/components/MoodIcon";
import { heatmapMoods, type HeatmapDay, type HeatmapMood } from "@/lib/mood-heatmap";
import { moodColors } from "./heatmap-colors";

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

function dateCounts(counts: Partial<Record<HeatmapMood, number>> = {}) {
    return Object.fromEntries(heatmapMoods.map(mood => [mood, counts[mood] ?? 0])) as Record<HeatmapMood, number>;
}

export function HeatmapDetailContent({ orgId, timezone, start, end, days, loading = false, error, onRetry }: HeatmapDateRange & {
    orgId: string;
    timezone: string;
    days: HeatmapDay[];
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
}) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
    const [checkInsLoading, setCheckInsLoading] = useState(false);
    const [checkInsError, setCheckInsError] = useState<string | null>(null);
    const [checkInsRetry, setCheckInsRetry] = useState(0);
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
    const checkInTimeFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
    }), [timezone]);

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
    </div>;
}
