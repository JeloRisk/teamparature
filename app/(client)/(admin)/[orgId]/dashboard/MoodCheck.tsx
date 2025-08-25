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
import { Smile, Frown } from "lucide-react"

export default function MoodCheck({ orgId, userId }: { orgId: string; userId: string }) {
    const { fetchMoods, hasTrackedToday, moodCountToday } = useMoodStore()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            await fetchMoods(orgId)
            setLoading(false)
        }
        load()
    }, [orgId, fetchMoods])

    const alreadyTracked = hasTrackedToday(userId)
    const count = moodCountToday(userId)

    if (loading) {
        return (
            <Card className="rounded-2xl shadow-sm border p-4">
                <p className="text-sm text-gray-500">Loading mood tracker...</p>
            </Card>
        )
    }

    return (
        <Card className="rounded-2xl shadow-sm border hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Mood Tracker</CardTitle>
            </CardHeader>
            <CardContent>
                {alreadyTracked ? (
                    <div className="flex items-center gap-3 text-green-600">
                        <Smile className="w-5 h-5" />
                        <p>
                            You already tracked{" "}
                            <span className="font-bold">{count}</span>{" "}
                            mood{count > 1 ? "s" : ""} today ✅
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 text-red-600">
                        <div className="flex items-center gap-3">
                            <Frown className="w-5 h-5" />
                            <p>No mood tracked today yet ❌</p>
                        </div>
                        <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                            Track Mood
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
