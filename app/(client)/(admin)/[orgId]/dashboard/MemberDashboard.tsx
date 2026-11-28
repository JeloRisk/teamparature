"use client"

import { CheckInSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { useState, type FormEvent } from "react"
import Link from "next/link"
import MoodIcon, { type MoodName } from "@/app/components/MoodIcon"
import { ArrowRight, ChevronLeft, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog"
import { useMoodStore } from "@/app/stores/useMoodStore"
import DailyCheckInPanel, { checkInMoods, MoodTile } from "./DailyCheckInPanel"

function getDateKey(value: string, timezone: string) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value))
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? ""
    return `${part("year")}-${part("month")}-${part("day")}`
}

function getRecentDays(timezone: string) {
    const today = getDateKey(new Date().toISOString(), timezone)
    const date = new Date(`${today}T12:00:00Z`)
    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(date)
        day.setUTCDate(day.getUTCDate() - 6 + index)
        const key = day.toISOString().slice(0, 10)
        return {
            key,
            label: new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: timezone }).format(day),
            date: new Intl.DateTimeFormat(undefined, { day: "numeric", timeZone: timezone }).format(day),
        }
    })
}

export default function MemberDashboard({ organization }: { organization: { _id: string; name: string } }) {
    return (
        <div className="mx-auto w-full min-w-0 max-w-4xl py-1 sm:py-3">
            <MemberCheckIn key={organization._id} organization={organization} />
        </div>
    )
}

function MemberCheckIn({ organization }: { organization: { _id: string; name: string } }) {
    const orgId = organization._id
    const summary = useMoodStore(state => state.orgId === orgId ? state.summary : null)
    const loadError = useMoodStore(state => state.orgId === orgId ? state.error : null)
    const fetchSummary = useMoodStore(state => state.fetchSummary)
    const addMood = useMoodStore(state => state.addMood)
    const [mood, setMood] = useState<MoodName>()
    const [rank, setRank] = useState<number>()
    const [note, setNote] = useState("")
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState("")
    const [detailsOpen, setDetailsOpen] = useState(false)

    function resetDraft() {
        setMood(undefined)
        setRank(undefined)
        setNote("")
        setSaveError("")
    }

    function handleDetailsOpenChange(open: boolean) {
        if (!open && saving) return
        setDetailsOpen(open)
        if (!open) resetDraft()
    }

    function chooseMood(value: MoodName) {
        if (saving) return
        setMood(value)
        setRank(undefined)
        setNote("")
        setSaveError("")
        setDetailsOpen(true)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!mood || !rank || saving || !summary || summary.checkedInToday) return
        setSaving(true)
        setSaveError("")
        try {
            await addMood({ orgId, mood, rank, note: note.trim() })
            setDetailsOpen(false)
            resetDraft()
        } catch {
            setSaveError("Could not save your check-in. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (summary?.checkedInToday) return <div className="space-y-4">
        <DailyCheckInPanel summary={summary} />
        <PersonalWeekCard orgId={orgId} summary={summary} />
    </div>
    if (!summary || loadError) {
        return <DailyCheckInPanel summary={summary} details={loadError ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p role="alert" className="text-sm text-muted-foreground">Couldn’t load your check-in status.</p>
                <Button variant="outline" onClick={() => fetchSummary(orgId)}>Try again</Button>
            </div>
        ) : <CheckInSkeleton />} />
    }

    return (
        <div className="space-y-4">
            <DailyCheckInPanel summary={summary} previewMood={mood} instruction="Choose a mood to continue." >
                <fieldset disabled={saving} className="min-w-0">
                    <legend className="sr-only">Choose your mood</legend>
                    <div className="grid grid-cols-5 gap-1 @xs/checkin:gap-1.5 @md/checkin:gap-2">
                        {checkInMoods.map(option => (
                            <button key={option.value} type="button" disabled={saving} onClick={() => chooseMood(option.value)}
                                aria-label={`Choose ${option.label}`} aria-pressed={mood === option.value}
                                className="group min-w-0 touch-manipulation rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait">
                                <MoodTile option={option} selected={mood === option.value} />
                            </button>
                        ))}
                    </div>
                </fieldset>
            </DailyCheckInPanel>
            <Dialog open={detailsOpen} onOpenChange={handleDetailsOpenChange}>
                <DialogContent showCloseButton={false} className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:left-1/2 sm:top-1/2 sm:h-[min(38rem,88dvh)] sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:overflow-y-auto sm:rounded-2xl sm:border sm:bg-card sm:shadow-lg">
                    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-card sm:px-6 sm:py-4">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost" size="icon" disabled={saving} aria-label="Back to mood selection" className="-ml-2 size-10 rounded-full text-foreground sm:hidden">
                                <ChevronLeft aria-hidden="true" className="size-5" />
                            </Button>
                        </DialogClose>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-base font-semibold sm:text-lg">Your check-in</DialogTitle>
                            <DialogDescription className="mt-1">Choose an intensity and add a note if it helps.</DialogDescription>
                        </div>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost" size="icon" disabled={saving} aria-label="Close check-in details" className="hidden size-9 rounded-full sm:inline-flex">
                                <X aria-hidden="true" className="size-4" />
                            </Button>
                        </DialogClose>
                    </header>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col sm:flex-1">
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                            {mood && <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-3">
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `var(--mood-${mood}-soft)` }}>
                                    <MoodIcon mood={mood} variant="mobile" className="size-8" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground">Selected mood</p>
                                    <p className="font-semibold capitalize">{mood}</p>
                                </div>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" disabled={saving} className="min-h-10 px-3 text-sm text-primary">Change mood</Button>
                                </DialogClose>
                            </div>}
                            <fieldset disabled={saving} className="min-w-0">
                                <legend className="font-semibold">How intense does it feel?</legend>
                                <div className="mt-3 grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map(value => (
                                        <label key={value} className="relative cursor-pointer has-disabled:cursor-default">
                                            <input className="peer sr-only" type="radio" name="intensity" value={value}
                                                checked={rank === value} onChange={() => setRank(value)} />
                                            <span className="flex h-11 items-center justify-center rounded-xl bg-muted text-sm font-semibold tabular-nums text-muted-foreground peer-enabled:hover:brightness-95 peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                                                {value}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Mild</span><span>Very strong</span></div>
                            </fieldset>
                            <div>
                                <label htmlFor="check-in-note" className="font-semibold">Add a note <span className="text-sm font-normal text-muted-foreground">(optional)</span></label>
                                <Textarea id="check-in-note" className="mt-2 rounded-xl shadow-none focus-visible:ring-ring/30" rows={4} maxLength={200} disabled={saving}
                                    value={note} onChange={event => setNote(event.target.value)} placeholder="Anything you’d like to add?" />
                                <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{note.length}/200</p>
                            </div>
                            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
                            {saving && <p className="sr-only" role="status">Saving your check-in…</p>}
                        </div>
                        <footer className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bg-card sm:px-6 sm:py-4">
                            <Button type="submit" disabled={!mood || !rank || saving} className="h-11 w-full rounded-lg px-5 shadow-none">
                                {saving ? "Saving…" : "Save check-in"}
                            </Button>
                        </footer>
                    </form>
                </DialogContent>
            </Dialog>
            <PersonalWeekCard orgId={orgId} summary={summary} />
        </div>
    )
}

function PersonalWeekCard({ orgId, summary }: { orgId: string; summary: NonNullable<ReturnType<typeof useMoodStore.getState>['summary']> }) {
    const timezone = summary.timezone ?? "UTC"
    const days = getRecentDays(timezone)
    const checkIns = days.flatMap(day => {
        const entry = summary.ownRecentCheckIns?.find(item => getDateKey(item.date, timezone) === day.key)
        return entry ? [entry] : []
    })
    return <section aria-labelledby="your-week-heading" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><h2 id="your-week-heading" className="font-semibold">Your week</h2><p className="mt-1 text-sm text-muted-foreground">{checkIns.length} of 7 days with a check-in</p></div>
            <Link href={`/${orgId}/mood-overview`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">Mood overview <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Your mood check-ins over the last seven days">
            {days.map(day => {
                const entry = summary.ownRecentCheckIns?.find(item => getDateKey(item.date, timezone) === day.key)
                return <div key={day.key} title={entry ? `${day.label}, ${day.date}: ${entry.mood}, intensity ${entry.rank} of 5` : `${day.label}, ${day.date}: no check-in`} className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border/70 bg-muted/35 px-1 py-2.5">
                    {entry ? <span className="grid size-9 place-items-center rounded-xl" style={{ backgroundColor: `var(--mood-${entry.mood}-soft)` }}><MoodIcon mood={entry.mood} variant="mobile" className="size-7" /></span> : <span className="grid size-9 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">—</span>}
                    <span className="text-center text-[11px] leading-tight text-muted-foreground"><span className="block font-medium">{day.label}</span><span className="mt-0.5 block tabular-nums">{day.date}</span></span>
                </div>
            })}
        </div>
    </section>
}
