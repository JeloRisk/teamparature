"use client"

import { useState } from "react"
import { CalendarDays, Check, ChevronDown, X } from "lucide-react"
import { useMoodAnalyticsStore } from "@/app/stores/useMoodAnalyticsStore"

function dateInZone(value: string, timezone: string) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date(value))
    const get = (type: string) => parts.find(part => part.type === type)?.value ?? ""
    return `${get("year")}-${get("month")}-${get("day")}`
}

function formatDateRange(startValue: string, endValue: string, timezone: string) {
    const start = new Date(startValue)
    const end = new Date(new Date(endValue).getTime() - 1)
    const startKey = dateInZone(start.toISOString(), timezone)
    const endKey = dateInZone(end.toISOString(), timezone)
    const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(undefined, { timeZone: timezone, ...options }).format(date)
    const fullDate: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }

    if (startKey === endKey) return format(start, fullDate)

    const startYear = Number(startKey.slice(0, 4))
    const endYear = Number(endKey.slice(0, 4))
    return startYear === endYear
        ? `${format(start, { month: "short", day: "numeric" })} – ${format(end, fullDate)}`
        : `${format(start, fullDate)} – ${format(end, fullDate)}`
}

export default function AnalyticsRangePicker({ orgId }: { orgId: string }) {
    const { analytics, selectedRange, fetchAnalytics } = useMoodAnalyticsStore()
    const [menuOpen, setMenuOpen] = useState(false)
    const [customOpen, setCustomOpen] = useState(false)
    const [from, setFrom] = useState(selectedRange.from ?? "")
    const [to, setTo] = useState(selectedRange.to ?? "")
    const preset = selectedRange.from ? "custom" : String(selectedRange.days ?? 14)
    const endDate = analytics.asOfDate || new Date().toISOString().slice(0, 10)
    const earliest = new Date(`${endDate}T00:00:00Z`)
    earliest.setUTCDate(earliest.getUTCDate() - 1825)
    const minDate = earliest.toISOString().slice(0, 10)
    const rangeIsOrdered = Boolean(from && to && from <= to)
    const rangeDays = rangeIsOrdered
        ? (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1
        : 0
    const currentRange = selectedRange.from && selectedRange.to && analytics.periodStart && analytics.periodEnd
        ? formatDateRange(analytics.periodStart, analytics.periodEnd, analytics.timezone)
        : ""
    const rangeHint = !from || !to
        ? "Choose a start and end date"
        : from > to
            ? "End date must be on or after the start date"
            : `${rangeDays.toLocaleString()} days selected`

    function openCustomRange() {
        if (selectedRange.from && selectedRange.to) {
            setFrom(selectedRange.from)
            setTo(selectedRange.to)
        }
        setCustomOpen(true)
    }

    const periodLabel = preset === "custom" ? currentRange || "Custom range" : `Last ${preset} days`

    return <div className="relative flex flex-wrap items-center gap-2">
        <button type="button" aria-label={`Analytics date range: ${periodLabel}`} aria-expanded={menuOpen || customOpen} onClick={() => { setCustomOpen(false); setMenuOpen(value => !value) }} className="inline-flex h-11 min-w-36 items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-w-44">
            <span className="flex min-w-0 items-center gap-2"><CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate">{periodLabel}</span></span>
            <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-muted-foreground transition-transform ${menuOpen || customOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && <div className="absolute right-0 top-full z-[60] mt-2 w-56 rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-xl" role="group" aria-label="Analytics date range">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reporting period</p>
            {[7, 14, 30, 90].map(days => <button key={days} type="button" onClick={() => { fetchAnalytics(orgId, true, { ...selectedRange, days, from: undefined, to: undefined }); setMenuOpen(false) }} className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring ${preset === String(days) ? "bg-accent font-semibold text-accent-foreground" : "text-foreground"}`}>
                Last {days} days{preset === String(days) && <Check className="size-4 text-primary" aria-hidden="true" />}
            </button>)}
            <div className="my-2 border-t border-border" />
            <button type="button" onClick={() => { setMenuOpen(false); openCustomRange() }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><CalendarDays className="size-4 text-primary" aria-hidden="true" />Choose dates</button>
        </div>}

        {customOpen && <>
        <button type="button" aria-label="Close date range picker" onClick={() => setCustomOpen(false)} className="fixed inset-0 z-[59] bg-foreground/35 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none" />
        <section aria-label="Choose analytics date range" className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-md rounded-t-[1.75rem] border border-border bg-card pb-[calc(1rem+env(safe-area-inset-bottom))] text-card-foreground shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:rounded-2xl sm:border sm:pb-4 sm:w-[min(26rem,calc(100vw-1.5rem))]">
            <div className="flex justify-center pt-2 sm:hidden"><span aria-hidden="true" className="h-1 w-11 rounded-full bg-muted-foreground/30" /></div>
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-4 sm:px-4 sm:pt-4">
                <div><p className="text-base font-semibold">Choose dates</p><p className="mt-1 text-sm text-muted-foreground">{rangeIsOrdered ? `${rangeDays.toLocaleString()} days · ${formatDateRange(`${from}T00:00:00Z`, `${new Date(Date.parse(`${to}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)}T00:00:00Z`, analytics.timezone)}` : "Set a start and end date"}</p></div>
                <button type="button" aria-label="Close" onClick={() => setCustomOpen(false)} className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><X className="size-5" /></button>
            </div>
            <div className="grid gap-4 px-5 sm:grid-cols-2 sm:px-4">
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Start date
                    <span className="relative"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <input type="date" value={from} min={minDate} max={endDate} onChange={event => setFrom(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-primary" />
                    </span>
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">End date
                    <span className="relative"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <input type="date" value={to} min={minDate} max={endDate} onChange={event => setTo(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-primary" />
                    </span>
                </label>
            </div>
            <p className={`px-5 pt-3 text-xs ${from && to && from > to ? "text-destructive" : "text-muted-foreground"}`}>{rangeHint} · Up to five years</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border px-5 pt-4 sm:px-4">
                <button type="button" onClick={() => { setFrom(""); setTo(""); fetchAnalytics(orgId, true, { ...selectedRange, days: 14, from: undefined, to: undefined }); setCustomOpen(false) }} className="min-h-12 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Reset</button>
                <button type="button" disabled={!from || !to || from > to || to > endDate || rangeDays > 1826}
                    onClick={() => {
                        fetchAnalytics(orgId, true, { from, to, year: selectedRange.year })
                        setCustomOpen(false)
                    }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"><Check className="size-4" aria-hidden="true" />Apply filters</button>
            </div>
        </section>
        </>}
    </div>
}
