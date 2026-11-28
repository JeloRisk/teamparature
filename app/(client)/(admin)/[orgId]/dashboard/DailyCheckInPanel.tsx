"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CalendarDays, CircleCheck } from "lucide-react"
import MoodIcon, { type MoodName } from "@/app/components/MoodIcon"
import MoodOrbit from "@/app/components/MoodOrbit"
import type { MoodSummary } from "@/app/stores/useMoodStore"
import { cn } from "@/lib/utils"

export const checkInMoods = [
    { value: "happy", label: "Happy" },
    { value: "excited", label: "Excited" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Sad" },
    { value: "stressed", label: "Stressed" },
] as const

export function MoodTile({ option, selected }: { option: typeof checkInMoods[number]; selected: boolean }) {
    return (
        <span
            style={{ backgroundColor: `var(--mood-${option.value}-soft)` }}
            className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent py-1.5 text-center text-foreground transition-colors group-hover:border-primary/50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring @md/checkin:min-h-16",
                selected && "border-primary ring-1 ring-primary",
            )}
        >
            <MoodIcon mood={option.value} variant="mobile" className="size-8 shrink-0 motion-safe:transition-transform motion-safe:group-active:scale-95 @md/checkin:size-9" />
            <span className="text-[10px] leading-4 font-semibold @xs/checkin:text-[11px] @md/checkin:text-xs">{option.label}</span>
        </span>
    )
}

interface DailyCheckInPanelProps {
    summary: MoodSummary | null
    previewMood?: MoodName
    instruction?: string
    children?: ReactNode
    details?: ReactNode
}

export default function DailyCheckInPanel({ summary, previewMood, instruction, children, details }: DailyCheckInPanelProps) {
    const [today, setToday] = useState<Date | null>(null)
    useEffect(() => { setToday(new Date()) }, [])
    const checkedIn = summary?.checkedInToday
    const saved = checkedIn ? summary.ownCheckIn : null
    const timeZone = summary?.timezone ?? "UTC"

    if (checkedIn) {
        return (
            <section aria-labelledby="daily-check-in-heading" className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent">
                    {saved ? <MoodIcon mood={saved.mood} variant="mobile" className="size-9" /> : <CircleCheck className="size-6 text-primary" />}
                </div>
                <div aria-live="polite">
                    <h1 id="daily-check-in-heading" className="text-lg font-semibold leading-tight">Checked in today</h1>
                    {saved && <p className="mt-1 text-sm text-muted-foreground">
                        <span className="capitalize">{saved.mood}</span>{" · "}
                        <time dateTime={saved.date}>{new Date(saved.date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone })}</time>
                    </p>}
                </div>
            </section>
        )
    }

    return (
        <section aria-labelledby="daily-check-in-heading" className="@container/checkin overflow-hidden rounded-2xl border border-primary/15 bg-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-4 py-4 @md/checkin:gap-x-5 @md/checkin:p-5 @2xl/checkin:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] @2xl/checkin:px-8 @2xl/checkin:py-6">
                <header className="min-w-0">
                    {today && <time dateTime={today.toISOString()} className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarDays aria-hidden="true" className="size-3.5 text-primary" />
                        {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", timeZone })}
                    </time>}
                    <div aria-live="polite" aria-atomic="true">
                        <h1 id="daily-check-in-heading" className="text-balance text-[1.65rem] leading-[1.13] @md/checkin:text-3xl @2xl/checkin:text-4xl">
                            {summary ? <>How are you <span className="text-primary">feeling today?</span></> : "Daily check-in"}
                        </h1>
                        {instruction && <p className="mt-2 text-sm leading-5 text-muted-foreground">{instruction}</p>}
                    </div>
                </header>
                <div aria-hidden="true" className={cn("pointer-events-none h-16 w-16 justify-self-center @xs/checkin:h-20 @xs/checkin:w-24 @md/checkin:h-24 @md/checkin:w-36 @2xl/checkin:col-start-2 @2xl/checkin:row-start-1 @2xl/checkin:h-32 @2xl/checkin:w-full @2xl/checkin:max-w-72", children && "@2xl/checkin:row-span-2 @2xl/checkin:h-44")}>
                    <MoodOrbit mood={previewMood} className="h-full w-full rounded-none bg-transparent sm:h-full lg:h-full" />
                </div>
                {children && <div className="col-span-2 mt-4 min-w-0 @2xl/checkin:col-span-1 @2xl/checkin:col-start-1 @2xl/checkin:max-w-xl">{children}</div>}
            </div>
            {details && <div className="space-y-5 border-t border-primary/10 bg-card p-4 @md/checkin:p-6">{details}</div>}
        </section>
    )
}
