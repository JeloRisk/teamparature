"use client"

import { CheckInSkeleton } from "@/app/components/loading/WorkspaceSkeletons"
import { useState, type FormEvent } from "react"
import MoodIcon from "@/app/components/MoodIcon"
import { Check, CircleCheck, Thermometer } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { useMoodStore } from "@/app/stores/useMoodStore"

const moods = [
    { value: "happy", label: "Happy" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Sad" },
    { value: "stressed", label: "Stressed" },
    { value: "excited", label: "Excited" },
] as const

export default function MemberDashboard({ organization }: { organization: { _id: string; name: string } }) {
    return (
        <div className="-m-4 flex-1 bg-background dark:bg-background px-4 md:-mx-10 md:px-10">
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
        <div className="max-w-2xl py-5 sm:py-10">
            <header className="py-2 sm:py-4">
                <p className="flex items-center gap-2 text-sm font-medium text-primary dark:text-primary">
                    <span className="rounded-lg bg-orange-100 dark:bg-[#423c30] p-1.5 text-orange-700 dark:text-[#e1c590]">
                        <Thermometer className="size-4" aria-hidden="true" />
                    </span>
                    Daily check-in
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground dark:text-foreground sm:text-4xl">
                    How are you feeling today?
                </h1>
                <p className="mt-1 break-words text-sm text-muted-foreground dark:text-muted-foreground">{organization.name}</p>
            </header>

            <section aria-label="Mood check-in" className="mt-5 rounded-3xl border border-border dark:border-border bg-card dark:bg-card p-5 sm:p-8">
                {summary?.checkedInToday ? (
                    <div role="status" className="flex items-start gap-4 rounded-2xl bg-accent dark:bg-accent p-4 sm:p-5">
                        <span className="rounded-full bg-card dark:bg-card p-2.5 text-primary dark:text-primary">
                            <CircleCheck className="size-6" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground dark:text-foreground">You’re checked in for today</h2>
                            <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">Your check-in is saved. See you tomorrow.</p>
                        </div>
                    </div>
                ) : loadError ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p role="alert" className="text-sm text-slate-700 dark:text-muted-foreground">Couldn’t load your check-in status.</p>
                        <Button variant="outline" onClick={() => fetchSummary(orgId)}>Try again</Button>
                    </div>
                ) : !summary ? (
                    <CheckInSkeleton />
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-7">
                        <fieldset disabled={saving}>
                            <legend className="font-semibold text-foreground dark:text-foreground">Choose a mood</legend>
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                {moods.map(option => (
                                    <label key={option.value} className="relative w-[calc((100%-1rem)/3)] cursor-pointer sm:w-[calc((100%-2rem)/5)]">
                                        <input className="peer sr-only" type="radio" name="mood" value={option.value}
                                            checked={mood === option.value} onChange={() => setMood(option.value)} />
                                        <span className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-border dark:border-border px-2 text-sm font-medium text-slate-700 dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted peer-checked:border-primary peer-checked:bg-accent dark:peer-checked:bg-accent dark:peer-checked:text-accent-foreground peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                                            <MoodIcon mood={option.value} className="size-11" />
                                            {option.label}
                                            {mood === option.value && <Check className="absolute right-2 top-2 size-3.5" aria-hidden="true" />}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset disabled={saving}>
                            <legend className="font-semibold text-foreground dark:text-foreground">How strong is that feeling?</legend>
                            <div className="mt-3 grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map(value => (
                                    <label key={value} className="relative cursor-pointer">
                                        <input className="peer sr-only" type="radio" name="intensity" value={value}
                                            checked={rank === value} onChange={() => setRank(value)} />
                                        <span className="flex h-11 items-center justify-center rounded-xl border border-border dark:border-border text-sm font-semibold text-slate-700 dark:text-muted-foreground peer-checked:border-primary peer-checked:bg-accent dark:peer-checked:bg-accent dark:peer-checked:text-accent-foreground peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                                            {value}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground dark:text-muted-foreground">
                                <span>A little</span>
                                <span>Very strong</span>
                            </div>
                        </fieldset>

                        <div>
                            <label htmlFor="check-in-note" className="font-semibold text-foreground dark:text-foreground">
                                Add a note <span className="text-sm font-normal text-muted-foreground dark:text-muted-foreground">(optional)</span>
                            </label>
                            <Textarea id="check-in-note" className="mt-2 rounded-xl border-border dark:border-border bg-muted/40 dark:bg-background focus-visible:ring-blue-700/40" rows={3} maxLength={200} disabled={saving}
                                value={note} onChange={event => setNote(event.target.value)} placeholder="Anything you’d like to add?" />
                            <p className="mt-1 text-right text-xs text-muted-foreground dark:text-muted-foreground">{note.length}/200</p>
                        </div>

                        {saveError && <p role="alert" className="text-sm text-red-700 dark:text-[#eea09a]">{saveError}</p>}
                        <Button type="submit" disabled={!mood || saving} className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                            {saving ? "Saving…" : "Save check-in"}
                        </Button>
                    </form>
                )}
            </section>
        </div>
    )
}
