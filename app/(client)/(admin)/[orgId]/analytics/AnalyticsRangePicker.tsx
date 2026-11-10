"use client"

import { useState } from "react"
import { CalendarDays, Check, ChevronDown } from "lucide-react"
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

    return <div className="relative">
        <label className="sr-only" htmlFor="analytics-period">Analytics period</label>
        <select id="analytics-period" aria-label="Analytics period" value={preset} onChange={event => {
            const value = event.target.value
            if (value === "custom") {
                openCustomRange()
                return
            }
            setCustomOpen(false)
            fetchAnalytics(orgId, true, { ...selectedRange, days: Number(value), from: undefined, to: undefined })
        }} className="h-10 max-w-36 appearance-none rounded-xl border border-border bg-background pl-3 pr-10 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:max-w-44">
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom dates</option>
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {preset === "custom" && <button type="button" onClick={openCustomRange} aria-label={currentRange ? `Edit custom date range, ${currentRange}` : "Edit custom date range"} title={currentRange ? `Edit custom date range: ${currentRange}` : "Edit custom date range"} className="ml-2 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <CalendarDays aria-hidden="true" className="size-4" />
            {currentRange && <span className="hidden max-w-[15rem] truncate xl:inline">{currentRange}</span>}
        </button>}

        {customOpen && <div className="absolute right-0 top-full z-[60] mt-2 w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl">
            <div className="mb-3">
                <p className="text-sm font-semibold">Custom date range</p>
                <p className="mt-1 text-xs text-muted-foreground">Up to five years · {analytics.timezone}</p>
            </div>
            <div className="grid gap-3">
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Start date
                    <span className="relative"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <input type="date" value={from} min={minDate} max={endDate} onChange={event => setFrom(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-medium text-foreground" />
                    </span>
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">End date
                    <span className="relative"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <input type="date" value={to} min={minDate} max={endDate} onChange={event => setTo(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-medium text-foreground" />
                    </span>
                </label>
            </div>
            <p className={`mt-3 text-xs ${from && to && from > to ? "text-destructive" : "text-muted-foreground"}`}>{rangeHint}</p>
            <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setCustomOpen(false)} className="h-9 rounded-lg px-3 text-sm font-medium hover:bg-muted">Cancel</button>
                <button type="button" disabled={!from || !to || from > to || to > endDate || rangeDays > 1826}
                    onClick={() => {
                        fetchAnalytics(orgId, true, { from, to, year: selectedRange.year })
                        setCustomOpen(false)
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Check className="size-4" aria-hidden="true" />Apply</button>
            </div>
        </div>}
    </div>
}
