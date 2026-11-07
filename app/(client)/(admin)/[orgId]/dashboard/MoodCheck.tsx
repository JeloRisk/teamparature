"use client"

import MoodIcon from "@/app/components/MoodIcon"
import { useState } from "react"
import { useMoodStore } from "@/app/stores/useMoodStore"

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog"

import { Smile } from "lucide-react"

type AllowedMood = "happy" | "neutral" | "sad" | "stressed" | "excited"

export default function MoodCheck({ orgId }: { orgId: string }) {
    const summary = useMoodStore(state => state.orgId === orgId ? state.summary : null)
    const addMood = useMoodStore(state => state.addMood)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    const [open, setOpen] = useState(false)
    const [mood, setMood] = useState<AllowedMood | "">("")
    const [rank, setRank] = useState(3)
    const [note, setNote] = useState("")

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

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-background/60 p-4 text-foreground">

            {/* glow effects */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 dark:bg-card/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />

            {/* HEADER */}
            <div className="relative flex items-start justify-between">

                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Wellbeing Check
                    </p>

                    <h2 className="mt-1 text-xl font-semibold leading-tight">
                        How are you feeling?
                    </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent dark:bg-card/15 text-lg backdrop-blur">
                    😊
                </div>
            </div>

            {/* CONTENT */}
            <div className=" mt-4">

                {summary?.checkedInToday ? (
                    <div className="rounded-2xl border border-white/10 bg-white/10 dark:bg-card/10 h-11 backdrop-blur-sm">
                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20">
                                <Smile className="h-5 w-5 text-primary" />
                            </div>

                            <div className="">
                                <p className="font-semibold">
                                    Already logged today
                                </p>

                                {/* <p className="text-sm text-muted-foreground">
                                    You’ve completed your check-in.
                                </p> */}
                            </div>
                        </div>
                    </div>
                ) : (
<Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
        <button className="h-11 w-full rounded-2xl bg-card dark:bg-card font-semibold text-primary dark:text-primary transition hover:bg-accent dark:hover:bg-accent">
            Log Mood
        </button>
    </DialogTrigger>

    <DialogContent className="overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl sm:max-w-md">

        {/* top glow */}
        <div className="relative bg-gradient-to-br dark:bg-none dark:bg-card from-white to-blue-50 px-6 py-5">

            {/* floating glow */}
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />

            {/* header */}
            <div className="relative flex items-start justify-between">
                <div>
                    <DialogTitle className="text-3xl font-bold text-slate-800 dark:text-foreground">
                        Track Your Mood
                    </DialogTitle>

                    <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                        Quick emotional check-in
                    </p>
                </div>

                <div className="text-3xl">🔥</div>
            </div>

            <div className="mt-8 space-y-6">

                {/* MOODS */}
                <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-800 dark:text-foreground">
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
                                onClick={() =>
                                    setMood(opt.value as AllowedMood)
                                }
                                className={`group rounded-2xl border px-2 py-3 transition-colors

                                ${
                                    mood === opt.value
                                        ? "border-emerald-400 bg-accent dark:bg-accent shadow-sm"
                                        : "border-border dark:border-border bg-card dark:bg-card hover:border-blue-300 hover:bg-accent dark:hover:bg-accent"
                                }`}
                            >
                                <div className="flex flex-col items-center justify-center">

                                    <MoodIcon mood={opt.value as AllowedMood} className="size-11 shrink-0" />

                                    <span className="mt-2 text-sm font-semibold text-slate-700 dark:text-muted-foreground">
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
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-foreground">
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
                                onClick={() => setRank(num)}
                                className={`h-12 rounded-xl border text-lg font-semibold transition

                                ${
                                    rank === num
                                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                                        : "border-border dark:border-border bg-card dark:bg-card text-slate-700 dark:text-muted-foreground hover:border-blue-300"
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
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-foreground">
                            Add a note (optional)
                        </h3>
                    </div>

                    <div className="relative">
                        <textarea
                            placeholder="Write something..."
                            value={note}
                            maxLength={200}
                            onChange={(e) => setNote(e.target.value)}
                            className="min-h-[120px] w-full rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-4 text-sm text-slate-700 dark:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
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
                    className="h-14 w-full rounded-2xl bg-gradient-to-r dark:bg-none dark:bg-muted from-blue-600 to-blue-500 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:from-blue-700 hover:to-blue-600"
                >
                    {submitting ? "Saving…" : "Submit"}
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