"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import MoodIcon, { type MoodName } from "@/app/components/MoodIcon"
import { Tooltip as HelpTooltip, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip"
import { positiveShare } from "@/lib/mood-reporting"

type MoodMixItem = { key: MoodName; label: string; color: string; value: number }

function MoodMixBar({ items, total, emptyMessage }: { items: MoodMixItem[]; total: number; emptyMessage: string }) {
    const highest = Math.max(0, ...items.map(item => item.value))

    if (!total) return <p className="mt-3 text-xs leading-5 text-muted-foreground">{emptyMessage}</p>

    return <div className="mt-3">
        <div aria-label={items.map(item => `${item.label}: ${item.value} ${item.value === 1 ? "check-in" : "check-ins"}`).join("; ")} role="img" className="flex h-10 items-center gap-1">
            {items.map(item => <div key={item.key} title={`${item.label}: ${item.value} ${item.value === 1 ? "check-in" : "check-ins"}`} className={`flex min-w-0 items-center justify-center overflow-hidden rounded-lg ${item.key === "happy" || item.key === "excited" ? "ring-2 ring-inset ring-primary/60" : ""} ${item.value === highest ? "h-10" : "h-9"}`} style={{ flexGrow: item.value, flexBasis: 0, backgroundColor: item.color }}>
                <MoodIcon mood={item.key} variant="mobile" className="w-full max-w-6" />
            </div>)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Mood check-in counts">
            {items.map(item => <li key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
                <span className="font-medium tabular-nums text-foreground">{item.value}</span>
            </li>)}
        </ul>
    </div>
}

export default function TeamTemperatureCard({ items, total, periodLabel, available = true }: { items: MoodMixItem[]; total: number; periodLabel?: string; available?: boolean }) {
    const [temperatureHelpOpen, setTemperatureHelpOpen] = useState(false)
    const happy = items.find(item => item.key === "happy")?.value ?? 0
    const excited = items.find(item => item.key === "excited")?.value ?? 0
    const temperature = positiveShare(happy, excited, total)
    return (
    <section className="col-span-2 min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="team-temperature-heading">
        <h3 id="team-temperature-heading" className="text-sm leading-5 sm:text-base">Team temperature{periodLabel && ` · ${periodLabel}`}</h3>
        <HelpTooltip open={temperatureHelpOpen} onOpenChange={setTemperatureHelpOpen}>
            <TooltipTrigger asChild>
                <button type="button" aria-label={`Team temperature: ${temperature === null ? "unavailable" : temperature + "%"}. Show calculation`}
                    onClick={event => { event.preventDefault(); setTemperatureHelpOpen(true) }}
                    className="flex min-h-11 items-center gap-2 rounded-md text-primary focus-visible:outline-2 focus-visible:outline-ring">
                    <span className="text-3xl font-semibold leading-none tracking-tight tabular-nums sm:text-4xl">{temperature === null ? "—" : `${temperature}%`}</span>
                    <Info className="size-4" aria-hidden="true" />
                </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={4} className="max-w-64 leading-relaxed">
                {temperature === null ? "Temperature is the share of check-ins marked Happy or Excited. No data is available for this period." :
                    `${happy} Happy + ${excited} Excited out of ${total} total check-ins = ${temperature}% (rounded).`}
            </TooltipContent>
        </HelpTooltip>
        {temperature !== null && <p className="text-sm text-muted-foreground">{happy + excited} of {total} {total === 1 ? "check-in was" : "check-ins were"} Happy or Excited.</p>}
        {available && <MoodMixBar items={items.filter(item => item.value > 0)} total={total} emptyMessage="No check-ins yet this period." />}
    </section>
    )
}
