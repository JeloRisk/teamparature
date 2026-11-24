"use client"

import { CheckInSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { useState, type FormEvent } from "react"
import MoodIcon from "@/app/components/MoodIcon"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { useMoodStore } from "@/app/stores/useMoodStore"
import CheckInConfirmation from "./CheckInConfirmation"

const moods = [
    { value: "happy", label: "Happy" },
    { value: "excited", label: "Excited" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Sad" },
    { value: "stressed", label: "Stressed" },
] as const

export default function MemberDashboard({ organization }: { organization: { _id: string; name: string } }) {
    return (
        <div className="dashboard-reference-theme workspace-page-surface mobile-page -m-4 min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-7 md:-mx-10 md:px-10">
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
    const [mood, setMood] = useState<(typeof moods)[number]["value"]>()
    const [rank, setRank] = useState(3)
    const [note, setNote] = useState("")
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState("")

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!mood || saving || !summary || summary.checkedInToday) return
        setSaving(true)
        setSaveError("")
        try {
            await addMood({ orgId, mood, rank, note: note.trim() })
        } catch {
            setSaveError("Could not save your check-in. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <section aria-labelledby="member-check-in-heading" className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-4 sm:space-y-6 sm:p-6">
            <header className="border-b border-border pb-4 sm:pb-5">
                <h1 id="member-check-in-heading" className="text-2xl leading-tight tracking-tight sm:text-4xl">
                    Daily check-in
                </h1>
                <p className="mt-1 hidden break-words text-sm text-muted-foreground md:block">{organization.name}</p>
            </header>

            {summary?.checkedInToday ? (
                <CheckInConfirmation checkIn={summary.ownCheckIn} timezone={summary.timezone} />
            ) : loadError ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p role="alert" className="text-sm text-muted-foreground">Couldn’t load your check-in status.</p>
                    <Button variant="outline" onClick={() => fetchSummary(orgId)}>Try again</Button>
                </div>
            ) : !summary ? (
                <CheckInSkeleton />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <fieldset disabled={saving} className="min-w-0">
                        <legend className="text-base font-semibold sm:text-lg">How are you feeling today?</legend>
                        <div className="mt-3 grid grid-cols-5 gap-1 min-[360px]:gap-1.5 sm:gap-2">
                            {moods.map(option => (
                                <label key={option.value} className="group relative min-w-0 cursor-pointer touch-manipulation has-disabled:cursor-default">
                                    <input className="peer sr-only" type="radio" name="mood" value={option.value}
                                        checked={mood === option.value} onChange={() => setMood(option.value)} />
                                    <span className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-2 transition-colors peer-enabled:hover:bg-muted peer-checked:border-primary peer-checked:bg-accent peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring sm:min-h-24 ${saving && mood !== option.value ? "opacity-60" : ""}`}>
                                        <MoodIcon mood={option.value} variant="mobile" className="size-10 shrink-0 motion-safe:transition-transform motion-safe:group-active:scale-90 sm:size-12" />
                                        <span className="max-w-full break-words text-center text-[10px] leading-4 min-[360px]:text-[11px] sm:text-sm">{option.label}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset disabled={saving} className="min-w-0">
                        <legend className="font-semibold">How strong is that feeling?</legend>
                        <div className="mt-3 grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map(value => (
                                <label key={value} className="relative cursor-pointer">
                                    <input className="peer sr-only" type="radio" name="intensity" value={value}
                                        checked={rank === value} onChange={() => setRank(value)} />
                                    <span className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-medium transition-colors peer-enabled:hover:bg-muted peer-checked:border-primary peer-checked:bg-accent peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                                        {value}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                            <span>A little</span>
                            <span>Very strong</span>
                        </div>
                    </fieldset>

                    <div>
                        <label htmlFor="check-in-note" className="font-semibold">
                            Add a note <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                        </label>
                        <Textarea id="check-in-note" className="mt-2 rounded-xl border-border bg-card focus-visible:ring-ring/30" rows={3} maxLength={200} disabled={saving}
                            value={note} onChange={event => setNote(event.target.value)} placeholder="Anything you’d like to add?" />
                        <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{note.length}/200</p>
                    </div>

                    {saveError && <p role="alert" className="text-sm text-red-700 dark:text-[#eea09a]">{saveError}</p>}
                    {saving && <p className="sr-only" role="status">Saving your check-in…</p>}
                    <Button type="submit" disabled={!mood || saving} className="h-11 w-full rounded-xl sm:w-auto">
                        {saving ? "Saving…" : "Save check-in"}
                    </Button>
                </form>
            )}
        </section>
    )
}
