"use client"

import MoodIcon from "@/app/components/MoodIcon"
import { Check } from "lucide-react"
import { useState } from "react"
import { useMoodStore } from "@/app/stores/useMoodStore"
import DailyCheckInPanel, { checkInMoods, MoodTile } from "./DailyCheckInPanel"

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/app/components/ui/dialog"

type AllowedMood = "happy" | "neutral" | "sad" | "stressed" | "excited"

export default function MoodCheck({ orgId, compact = false }: { orgId: string; compact?: boolean }) {
    const summary = useMoodStore(state => state.orgId === orgId ? state.summary : null)
    const addMood = useMoodStore(state => state.addMood)
    const [submitting, setSubmitting] = useState(false)
    const [pendingMood, setPendingMood] = useState<AllowedMood | null>(null)
    const [error, setError] = useState("")

    const [open, setOpen] = useState(false)
    const [mood, setMood] = useState<AllowedMood | "">("")
    const [rank, setRank] = useState(3)
    const [note, setNote] = useState("")

    const handleQuickSubmit = async (selectedMood: AllowedMood) => {
        if (pendingMood || summary?.checkedInToday) return
        setPendingMood(selectedMood)
        setError("")
        try {
            await addMood({ orgId, mood: selectedMood, rank: 3, note: "" })
        } catch {
            setError("Could not save your check-in. Please try again.")
        } finally {
            setPendingMood(null)
        }
    }

    const handleSubmit = async () => {
        if (!mood || submitting) return

        setSubmitting(true)
        setError("")
        try {
            await addMood({ orgId, mood, rank, note })
            setMood("")
            setRank(3)
            setNote("")
            setOpen(false)
        } catch {
            setError("Could not save your check-in. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (compact) {
        return (
            <DailyCheckInPanel summary={summary} previewMood={pendingMood ?? undefined} instruction={summary ? "Choose a mood to check in." : undefined}>
                {summary && !summary.checkedInToday && <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-1 @xs/checkin:gap-1.5 @md/checkin:gap-2" role="group" aria-label="Choose your mood">
                        {checkInMoods.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                disabled={pendingMood !== null}
                                onClick={() => handleQuickSubmit(option.value)}
                                aria-label={`Check in as ${option.label}`}
                                className="group min-w-0 touch-manipulation rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait"
                            >
                                <MoodTile option={option} selected={pendingMood === option.value} />
                            </button>
                        ))}
                    </div>
                    {pendingMood && <p className="text-sm text-muted-foreground" role="status">Saving your check-in…</p>}
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                </div>}
            </DailyCheckInPanel>
        )
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-background/60 p-4 text-foreground">

            {/* glow effects */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 dark:bg-card/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />

            {/* HEADER */}
            <div className="relative flex items-start justify-between gap-4">
                <h2 className="mt-1 text-xl font-semibold leading-tight">How are you feeling?</h2>
                <MoodIcon mood="happy" className="size-11" />
            </div>

            {/* CONTENT */}
            <div className="mt-4">

                {summary?.checkedInToday ? (
                    <div role="status" className="flex min-h-14 items-center gap-3 rounded-xl bg-[var(--mood-excited-soft)] px-3.5 py-3 text-sm text-foreground">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--mood-excited)_18%,var(--card))] text-[var(--mood-excited)]">
                            <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                        </span>
                        <p className="font-medium leading-5">Your check-in is saved. See you tomorrow.</p>
                    </div>
                ) : (
<Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
        <button className="h-11 w-full rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Log Mood
        </button>
    </DialogTrigger>

    <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-0 sm:max-w-lg">

        {/* top glow */}
        <div className="relative px-5 py-6 sm:px-7">

            {/* floating glow */}


            {/* header */}
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                        Today’s check-in
                    </DialogTitle>

                    <DialogDescription className="mt-2 text-sm text-muted-foreground">
                        Take a moment to notice how you feel today.
                    </DialogDescription>
                </div>


            </div>

            <div className="mt-8 space-y-6">

                {/* MOODS */}
                <div>
                    <h3 className="mb-3 text-sm font-medium text-foreground">
                        How are you feeling?
                    </h3>

                    {/* positive -> negative */}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">

                        {[
                            {
                                value: "happy",
                                label: "Happy",
                                icon: "😀",
                            },
                            {
                                value: "excited",
                                label: "Excited",
                                icon: "🤩",
                            },
                            {
                                value: "neutral",
                                label: "Neutral",
                                icon: "😐",
                            },
                            {
                                value: "sad",
                                label: "Sad",
                                icon: "😞",
                            },

                            {
                                value: "stressed",
                                label: "Stressed",
                                icon: "😰",
                            },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                aria-pressed={mood === opt.value}
                                onClick={() => setMood(opt.value as AllowedMood)}
                                className={`group rounded-2xl border px-2 py-3 transition-colors

                                ${
                                    mood === opt.value
                                        ? "border-primary bg-accent ring-1 ring-primary"
                                        : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
                                }`}
                            >
                                <div className="flex flex-col items-center justify-center">

                                    <MoodIcon mood={opt.value as AllowedMood} className="size-11 shrink-0" />

                                    <span className="mt-2 text-xs font-medium text-foreground">
                                        {opt.label}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* INTENSITY */}
                <div>
                    <div className="mb-3">
                        <h3 className="text-sm font-medium text-foreground">
                            Mood Intensity
                        </h3>

                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            How intense is your mood?
                        </p>
                    </div>

                    {/* one row instead of slider */}
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                aria-pressed={rank === num}
                                aria-label={`${num} out of 5 intensity`}
                                onClick={() => setRank(num)}
                                className={`h-11 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring

                                ${
                                    rank === num
                                        ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary"
                                        : "border-border bg-card text-foreground hover:border-primary/50"
                                }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                {/* NOTE */}
                <div>
                    <div className="mb-3">
                        <h3 className="text-sm font-medium text-foreground">
                            Add a note (optional)
                        </h3>
                    </div>

                    <div className="relative">
                        <textarea
                            placeholder="Write something..."
                            value={note}
                            maxLength={200}
                            onChange={(e) => setNote(e.target.value)}
                            aria-label="Optional check-in note"
                            className="min-h-28 w-full rounded-xl border border-border bg-background/40 p-3 pb-8 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/25"
                        />

                        <span className="absolute bottom-4 right-4 text-sm text-slate-400">
                            {note.length}/200
                        </span>
                    </div>
                </div>

                {error && <p role="alert" className="text-red-700 dark:text-[#eea09a]">{error}</p>}
                <button
                    onClick={handleSubmit}
                    disabled={!mood || submitting}
                    className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                    {submitting ? "Saving…" : "Save check-in"}
                </button>
            </div>
        </div>
    </DialogContent>
</Dialog>
                )}
            </div>
        </div>
    )
}
