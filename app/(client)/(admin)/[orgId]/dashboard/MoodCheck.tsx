"use client"
import { useEffect, useState } from "react"
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Smile, Frown } from "lucide-react"

const moodOptions = [
    { label: "Happy", value: "happy", icon: "😊" },
    { label: "Neutral", value: "neutral", icon: "😐" },
    { label: "Sad", value: "sad", icon: "😢" },
    { label: "Stressed", value: "stressed", icon: "😰" },
    { label: "Excited", value: "excited", icon: "🤩" },
]

export default function MoodCheck({ orgId, userId }: { orgId: string; userId: string }) {
    const { fetchMoods, hasTrackedToday, moodCountToday, addMood } = useMoodStore()
    const [open, setOpen] = useState(false)
    const [mood, setMood] = useState("")
    const [rank, setRank] = useState(3)
    const [note, setNote] = useState("")

    useEffect(() => {
        fetchMoods(orgId)
    }, [orgId, fetchMoods])

    const alreadyTracked = hasTrackedToday()
    console.log("okaya", alreadyTracked)
    const count = moodCountToday(userId)

    const handleSubmit = async () => {
        if (!mood) return
        await addMood({ orgId, userId, mood, rank, note })
        setMood("")
        setRank(3)
        setNote("")
        setOpen(false)
    }

    return (
        <Card className={`border  hover:border-orange-300 transition gap-2`}>
            <CardHeader className="">
                <CardTitle className="text-lg font-semibold">Today's Mood</CardTitle>
            </CardHeader>
            <CardContent>
                {alreadyTracked ? (
                    <div className="flex items-center gap-3 text-green-600">
                        <Smile className="w-5 h-5" />
                        <p>
                            You already tracked{" "}
                            {/* <span className="font-bold">{count}</span>{" "}
                            mood{count > 1 ? "s" : ""} */}
                            today
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 text-red-600">
                        <div className="flex flex-row items-center gap-2 text-blue-400 animate-pulse">
                            <div className="text-md">❄️</div>
                            <p className="text-center text-lg font-medium">
                                No mood tracked today yet
                            </p>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                    Track Mood
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Track Your Mood</DialogTitle>
                                </DialogHeader>

                                <div className="flex flex-col gap-4">
                                    {/* Mood Select */}
                                    <div className="flex gap-2 flex-wrap">
                                        {moodOptions.map((opt) => (
                                            <Button
                                                key={opt.value}
                                                type="button"
                                                variant={mood === opt.value ? "default" : "outline"}
                                                className={`flex-1 ${mood === opt.value ? "bg-blue-600 text-white" : ""}`}
                                                onClick={() => setMood(opt.value)}
                                            >
                                                <span className="mr-1">{opt.icon}</span> {opt.label}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Rank Slider */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Mood Intensity (1–5)</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={rank}
                                            onChange={(e) => setRank(Number(e.target.value))}
                                            className="w-full"
                                        />
                                        <p className="text-sm text-gray-500">Selected: {rank}</p>
                                    </div>

                                    =                                    <Textarea
                                        placeholder="Add a note (optional)..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>

                                <DialogFooter className="mt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                    >
                                        Submit
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}