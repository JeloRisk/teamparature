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
    const rangeDays = from && to
        ? (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1
        : 0
    const currentRange = analytics.periodStart && analytics.periodEnd
        ? `${dateInZone(analytics.periodStart, analytics.timezone)} – ${dateInZone(new Date(new Date(analytics.periodEnd).getTime() - 1).toISOString(), analytics.timezone)}`
        : ""

    return <div className="relative">
        <label className="sr-only" htmlFor="analytics-period">Analytics period</label>
        <select id="analytics-period" aria-label="Analytics period" value={preset} onChange={event => {
            const value = event.target.value
            if (value === "custom") {
                if (!from && selectedRange.from) setFrom(selectedRange.from)
                if (!to && selectedRange.to) setTo(selectedRange.to)
                setCustomOpen(true)
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
        {currentRange && <span className="ml-2 hidden text-xs font-medium text-muted-foreground xl:inline">{currentRange}</span>}

        {customOpen && <div className="absolute right-0 top-full z-[60] mt-2 w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl">
            <div className="mb-3">
                <p className="text-sm font-semibold">Custom date range</p>
                <p className="mt-1 text-xs text-muted-foreground">Up to five years · {analytics.timezone}</p>
            </div>
            <div className="grid gap-3">
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Start date
                    <span className="relative"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <input type="date" value={from} min={minDate} max={to || endDate} onChange={event => setFrom(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-medium text-foreground" />
                    </span>
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">End date
                    <span className="relative"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                        <input type="date" value={to} min={from || minDate} max={endDate} onChange={event => setTo(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-medium text-foreground" />
                    </span>
                </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{rangeDays ? `${rangeDays.toLocaleString()} days selected` : "Choose a start and end date"}</p>
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
