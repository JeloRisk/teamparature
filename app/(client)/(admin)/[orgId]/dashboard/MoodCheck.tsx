"use client"

import { useState } from "react"
import { useMoodStore } from "@/app/stores/useMoodStore"

// import {
//     Card,
//     CardContent,
//     CardHeader,
//     CardTitle,
// } from "@/app/components/ui/card"

// import { Button } from "@/app/components/ui/button"

import {
    Dialog,
    DialogContent,

    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog"

// import { Textarea } from "@/app/components/ui/textarea"

import { Smile } from "lucide-react"

// const moodOptions = [
//     { label: "Happy", value: "happy", icon: "😊" },
//     { label: "Neutral", value: "neutral", icon: "😐" },
//     { label: "Sad", value: "sad", icon: "😢" },
//     { label: "Stressed", value: "stressed", icon: "😰" },
//     { label: "Excited", value: "excited", icon: "🤩" },
// ]

type AllowedMood = "happy" | "neutral" | "sad" | "stressed" | "excited"

export default function MoodCheck({
    orgId,
    userId,
}: {
    orgId: string
    userId: string
}) {
    const { hasTrackedToday, addMood } = useMoodStore()

    const [open, setOpen] = useState(false)
    const [mood, setMood] = useState<AllowedMood | "">("")
    const [rank, setRank] = useState(3)
    const [note, setNote] = useState("")

    const alreadyTracked = hasTrackedToday()

    const handleSubmit = async () => {
        if (!mood) return

        await addMood({
            orgId,
            userId,
            mood,
            rank,
            note,
        })

        setMood("")
        setRank(3)
        setNote("")
        setOpen(false)
    }

    return (
        <div className="relative overflow-hidden rounded-[32px] bg-[#ff4c00] p-5 text-white shadow-md">

            {/* glow effects */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />

            {/* HEADER */}
            <div className="relative flex items-start justify-between">

                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
                        Wellbeing Check
                    </p>

                    <h2 className="mt-1 text-3xl font-bold leading-tight">
                        How are you feeling?
                    </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg backdrop-blur">
                    😊
                </div>
            </div>

            {/* CONTENT */}
            <div className=" mt-4">

                {alreadyTracked ? (
                    <div className="rounded-2xl border border-white/10 bg-white/10 h-11 backdrop-blur-sm">
                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20">
                                <Smile className="h-5 w-5 text-emerald-100" />
                            </div>

                            <div className="">
                                <p className="font-semibold">
                                    Already logged today
                                </p>

                                {/* <p className="text-sm text-blue-100">
                                    You’ve completed your check-in.
                                </p> */}
                            </div>
                        </div>
                    </div>
                ) : (
<Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
        <button className="h-11 w-full rounded-2xl bg-white font-semibold text-blue-700 transition hover:bg-blue-50">
            Log Mood
        </button>
    </DialogTrigger>

    <DialogContent className="overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl sm:max-w-md">

        {/* top glow */}
        <div className="relative bg-gradient-to-br from-white to-blue-50 px-6 py-5">

            {/* floating glow */}
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />

            {/* header */}
            <div className="relative flex items-start justify-between">
                <div>
                    <DialogTitle className="text-3xl font-bold text-slate-800">
                        Track Your Mood
                    </DialogTitle>

                    <p className="mt-1 text-sm text-slate-500">
                        Quick emotional check-in
                    </p>
                </div>

                <div className="text-3xl">🔥</div>
            </div>

            <div className="mt-8 space-y-6">

                {/* MOODS */}
                <div>
                    <h3 className="mb-3 text-lg font-semibold text-slate-800">
                        How are you feeling?
                    </h3>

                    {/* positive -> negative */}
                    <div className="grid grid-cols-5 gap-3">

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
                                className={`group rounded-2xl border p-4 transition-all

                                ${
                                    mood === opt.value
                                        ? "border-emerald-400 bg-blue-100 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                                }`}
                            >
                                <div className="flex flex-col items-center justify-center">

                                    <span className="text-4xl transition-transform group-hover:scale-110">
                                        {opt.icon}
                                    </span>

                                    <span className="mt-2 text-sm font-semibold text-slate-700">
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
                        <h3 className="text-lg font-semibold text-slate-800">
                            Mood Intensity
                        </h3>

                        <p className="text-sm text-slate-500">
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
                                        ? "border-blue-600 bg-blue-600 text-white shadow-md"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
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
                        <h3 className="text-lg font-semibold text-slate-800">
                            Add a note (optional)
                        </h3>
                    </div>

                    <div className="relative">
                        <textarea
                            placeholder="Write something..."
                            value={note}
                            maxLength={200}
                            onChange={(e) => setNote(e.target.value)}
                            className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />

                        <span className="absolute bottom-4 right-4 text-sm text-slate-400">
                            {note.length}/200
                        </span>
                    </div>
                </div>

                {/* submit */}
                <button
                    onClick={handleSubmit}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:from-blue-700 hover:to-blue-600"
                >
                    Submit
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