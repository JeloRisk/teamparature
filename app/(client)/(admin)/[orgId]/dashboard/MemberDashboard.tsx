"use client"

import { useState, type FormEvent } from "react"
import { Check, CircleCheck, Thermometer } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { useMoodStore } from "@/app/stores/useMoodStore"

const moods = [
    { value: "happy", label: "Happy", emoji: "😊" },
    { value: "excited", label: "Excited", emoji: "🤩" },
    { value: "neutral", label: "Neutral", emoji: "😐" },
    { value: "sad", label: "Sad", emoji: "😔" },
    { value: "stressed", label: "Stressed", emoji: "😰" },
] as const

export default function MemberDashboard({ organization }: { organization: { _id: string; name: string } }) {
    return (
        <div className="-m-4 flex-1 bg-[#f4f7fc] px-4 md:-mx-10 md:px-10">
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
                <p className="flex items-center gap-2 text-sm font-medium text-blue-900">
                    <span className="rounded-lg bg-orange-100 p-1.5 text-orange-700">
                        <Thermometer className="size-4" aria-hidden="true" />
                    </span>
                    Daily check-in
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1e2e4a] sm:text-4xl">
                    How are you feeling today?
                </h1>
                <p className="mt-1 break-words text-sm text-[#4a5c78]">{organization.name}</p>
            </header>

            <section aria-label="Mood check-in" className="mt-5 rounded-3xl border border-[#dce4f0] bg-white p-5 sm:p-8">
                {summary?.checkedInToday ? (
                    <div role="status" className="flex items-start gap-4 rounded-2xl bg-[#eef4ff] p-4 sm:p-5">
                        <span className="rounded-full bg-white p-2.5 text-blue-800">
                            <CircleCheck className="size-6" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold text-[#1e2e4a]">You’re checked in for today</h2>
                            <p className="mt-1 text-sm text-slate-600">Your check-in is saved. See you tomorrow.</p>
                        </div>
                    </div>
                ) : loadError ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p role="alert" className="text-sm text-slate-700">Couldn’t load your check-in status.</p>
                        <Button variant="outline" onClick={() => fetchSummary(orgId)}>Try again</Button>
                    </div>
                ) : !summary ? (
                    <p role="status" className="text-sm text-slate-600">Loading your check-in…</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-7">
                        <fieldset disabled={saving}>
                            <legend className="font-semibold text-[#1e2e4a]">Choose a mood</legend>
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                {moods.map(option => (
                                    <label key={option.value} className="relative w-[calc((100%-1rem)/3)] cursor-pointer sm:w-[calc((100%-2rem)/5)]">
                                        <input className="peer sr-only" type="radio" name="mood" value={option.value}
                                            checked={mood === option.value} onChange={() => setMood(option.value)} />
                                        <span className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-[#dce4f0] px-2 text-sm font-medium text-slate-700 hover:bg-[#f5f8ff] peer-checked:border-blue-700 peer-checked:bg-[#eaf0ff] peer-checked:text-blue-950 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-700 peer-focus-visible:ring-offset-2">
                                            <span className="text-xl" aria-hidden="true">{option.emoji}</span>
                                            {option.label}
                                            {mood === option.value && <Check className="absolute right-2 top-2 size-3.5" aria-hidden="true" />}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset disabled={saving}>
                            <legend className="font-semibold text-[#1e2e4a]">How strong is that feeling?</legend>
                            <div className="mt-3 grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map(value => (
                                    <label key={value} className="relative cursor-pointer">
                                        <input className="peer sr-only" type="radio" name="intensity" value={value}
                                            checked={rank === value} onChange={() => setRank(value)} />
                                        <span className="flex h-11 items-center justify-center rounded-xl border border-[#dce4f0] text-sm font-semibold text-slate-700 peer-checked:border-blue-700 peer-checked:bg-[#eaf0ff] peer-checked:text-blue-950 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-700 peer-focus-visible:ring-offset-2">
                                            {value}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-slate-600">
                                <span>A little</span>
                                <span>Very strong</span>
                            </div>
                        </fieldset>

                        <div>
                            <label htmlFor="check-in-note" className="font-semibold text-[#1e2e4a]">
                                Add a note <span className="text-sm font-normal text-slate-600">(optional)</span>
                            </label>
                            <Textarea id="check-in-note" className="mt-2 rounded-xl border-[#dce4f0] bg-[#fafbff] focus-visible:ring-blue-700/40" rows={3} maxLength={200} disabled={saving}
                                value={note} onChange={event => setNote(event.target.value)} placeholder="Anything you’d like to add?" />
                            <p className="mt-1 text-right text-xs text-slate-600">{note.length}/200</p>
                        </div>

                        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
                        <Button type="submit" disabled={!mood || saving} className="h-11 w-full bg-blue-800 text-white hover:bg-blue-900 sm:w-auto">
                            {saving ? "Saving…" : "Save check-in"}
                        </Button>
                    </form>
                )}
            </section>
        </div>
    )
}
