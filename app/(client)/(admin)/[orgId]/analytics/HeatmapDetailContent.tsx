"use client";

import { useMemo } from "react";
import MoodIcon from "@/app/components/MoodIcon";
import { heatmapMoods, leadingMoods, type HeatmapDay, type HeatmapMood } from "@/lib/mood-heatmap";
import { moodColors } from "./heatmap-colors";

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

export function HeatmapDetailContent({ start, end, days, loading = false, error, onRetry }: HeatmapDateRange & {
    days: HeatmapDay[];
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
}) {
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
    const leaders = leadingMoods(totals);
    const maxDayTotal = Math.max(1, ...daily.map(day => day.total));

    if (loading) return <div role="status" aria-label="Loading date details" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="h-52 animate-pulse rounded-2xl bg-muted" />
        <span className="sr-only">Loading check-in details</span>
    </div>;

    if (error) return <div role="alert" className="rounded-2xl border border-border bg-muted/50 p-5 text-sm">
        <p className="font-semibold text-foreground">We couldn’t load this date range.</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-4 min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Try again</button>}
    </div>;

    return <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-muted-foreground">Total check-ins</h3>
                <p className="mt-3 text-4xl font-semibold leading-none tracking-tight tabular-nums text-foreground">{total.toLocaleString()}</p>
                <p className="mt-2 text-xs text-muted-foreground">Across {daily.length} {daily.length === 1 ? "day" : "days"}</p>
                {total > 0 && <div role="img" aria-label={`Mood distribution across ${total} check-ins`} className="mt-5 flex h-4 overflow-hidden rounded-full bg-muted">
                    {heatmapMoods.map(mood => totals[mood] > 0 && <span key={mood} title={`${mood}: ${totals[mood]}`} style={{ width: `${totals[mood] / total * 100}%`, backgroundColor: moodColors[mood] }} />)}
                </div>}
                {total === 0 && <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">No check-ins were recorded for this date range.</p>}
            </article>

            <article className="min-w-0 rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-muted-foreground">Most reported mood</h3>
                <div className="mt-3 flex min-w-0 items-center gap-3">
                    {leaders.length === 1 && <MoodIcon mood={leaders[0]} className="size-9 shrink-0" variant="mobile" />}
                    <p className="truncate text-2xl font-semibold capitalize leading-tight text-foreground">
                        {leaders.length === 0 ? "No check-ins" : leaders.length === 1 ? leaders[0] : "Tied moods"}
                    </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {leaders.length === 0
                        ? "There are no mood responses to summarize."
                        : leaders.length === 1
                            ? `${totals[leaders[0]]} of ${total} ${total === 1 ? "check-in" : "check-ins"} · ${Math.round(totals[leaders[0]] / total * 100)}%`
                            : `${leaders.join(" and ")} · ${totals[leaders[0]]} each`}
                </p>
                {leaders.length > 1 && <div className="mt-3 flex flex-wrap gap-2">{leaders.map(mood => <span key={mood} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs capitalize text-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: moodColors[mood] }} />{mood}</span>)}</div>}
            </article>
        </div>

        {daily.length > 1 && <section aria-labelledby="heatmap-daily-activity" className="rounded-2xl border border-border bg-card p-5">
            <div>
                <h3 id="heatmap-daily-activity" className="text-sm font-semibold text-foreground">Daily check-ins</h3>
                <p className="mt-1 text-xs text-muted-foreground">Mood responses by day in this range</p>
            </div>
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(2.25rem,1fr))] items-end gap-2">
                {daily.map(day => <div key={day.date} role="img" aria-label={`${formatDateKey(day.date, true)}: ${day.total} check-ins`} title={`${formatDateKey(day.date, true)} · ${day.total} check-ins`} className="min-w-0 text-center">
                    <span className="mb-1 block h-4 text-[10px] tabular-nums text-muted-foreground">{day.total || ""}</span>
                    <div className="mx-auto flex h-28 w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md bg-muted/60">
                        {[...heatmapMoods].reverse().map(mood => day.counts[mood] > 0 && <span key={mood} className="min-h-1" style={{ height: `${day.counts[mood] / maxDayTotal * 100}%`, backgroundColor: moodColors[mood] }} />)}
                    </div>
                    <span className="mt-2 block truncate text-[10px] text-muted-foreground">{dateKeyToUtcDate(day.date).getUTCDate()}</span>
                </div>)}
            </div>
            <ul aria-label="Mood chart legend" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] capitalize text-muted-foreground">
                {heatmapMoods.map(mood => <li key={mood} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: moodColors[mood] }} />{mood}</li>)}
            </ul>
        </section>}

        <section aria-labelledby="heatmap-mood-breakdown" className="rounded-2xl border border-border bg-card p-5">
            <h3 id="heatmap-mood-breakdown" className="text-sm font-semibold text-foreground">Mood breakdown</h3>
            <ul className="mt-3 divide-y divide-border/70">
                {heatmapMoods.map(mood => {
                    const share = total ? Math.round(totals[mood] / total * 100) : 0;
                    return <li key={mood} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                        <MoodIcon mood={mood} className="size-7 shrink-0" variant="mobile" />
                        <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium capitalize text-foreground">{mood}</span>
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{totals[mood]} · {share}%</span>
                            </div>
                            <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${share}%`, backgroundColor: moodColors[mood] }} /></div>
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{totals[mood]} {totals[mood] === 1 ? "check-in" : "check-ins"}</span>
                    </li>;
                })}
            </ul>
        </section>
    </div>;
}
