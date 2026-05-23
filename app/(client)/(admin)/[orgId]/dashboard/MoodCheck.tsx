"use client"

import { useState } from "react"
import { useMoodStore } from "@/app/stores/useMoodStore"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card"

import { Button } from "@/app/components/ui/button"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog"

import { Textarea } from "@/app/components/ui/textarea"

import { Smile } from "lucide-react"

const moodOptions = [
    { label: "Happy", value: "happy", icon: "😊" },
    { label: "Neutral", value: "neutral", icon: "😐" },
    { label: "Sad", value: "sad", icon: "😢" },
    { label: "Stressed", value: "stressed", icon: "😰" },
    { label: "Excited", value: "excited", icon: "🤩" },
]

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
        <Card className="relative overflow-hidden border-0 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-md h-full">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl" />

            {/* HEADER (single clear identity) */}
            <CardHeader className="relative pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-blue-100">
                            Wellbeing Check
                        </p>

                        <CardTitle className="mt-1 text-3xl font-bold">
                            How are you feeling?
                        </CardTitle>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur text-lg">
                        😊
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative flex flex-col gap-5 pt-0">

                {alreadyTracked ? (
                    <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/20">
                                <Smile className="h-4 w-4 text-emerald-100" />
                            </div>

                            <div>
                                <p className="font-medium">
                                    Already logged today
                                </p>
                                <p className="text-xs text-blue-100">
                                    You’ve completed your check-in.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* <p className="text-sm text-blue-100">
                            Take a moment to reflect and log your current mood.
                        </p> */}

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-semibold">
                                    Log Mood
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>Quick Mood Check</DialogTitle>
                                </DialogHeader>

                                <div className="flex flex-col gap-4 py-2">

                                    {/* moods */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {moodOptions.map((opt) => (
                                            <Button
                                                key={opt.value}
                                                type="button"
                                                variant={mood === opt.value ? "default" : "outline"}
                                                className={`h-11 rounded-xl ${
                                                    mood === opt.value
                                                        ? "bg-blue-600 text-white"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setMood(opt.value as AllowedMood)
                                                }
                                            >
                                                <span className="mr-2">{opt.icon}</span>
                                                {opt.label}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* intensity */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Intensity ({rank}/5)
                                        </label>

                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={rank}
                                            onChange={(e) =>
                                                setRank(Number(e.target.value))
                                            }
                                            className="w-full accent-blue-600"
                                        />
                                    </div>

                                    {/* note */}
                                    <Textarea
                                        placeholder="Add a short note (optional)..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        onClick={handleSubmit}
                                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                                    >
                                        Save Entry
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </CardContent>
        </Card>
    )
}