"use client";
import { useMoodStore } from "@/app/stores/useMoodStore";
import MoodTrendsChart from "./MoodTrendsChart";

export default function MoodAnalytics({ orgId }: { orgId: string }) {
    const { moods } = useMoodStore();
    const moodData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const day = date.toLocaleDateString("en-US", { weekday: "short" });

        const filterByMoodAndDate = (moodType: string) =>
            moods.filter(
                (m) =>
                    m.mood === moodType &&
                    new Date(m.date).toDateString() === date.toDateString()
            ).length;

        return {
            day,
            happy: filterByMoodAndDate("happy"),
            neutral: filterByMoodAndDate("neutral"),
            sad: filterByMoodAndDate("sad"),
            stressed: filterByMoodAndDate("stressed"),
            excited: filterByMoodAndDate("excited"),
        };
    });


    return (
        <MoodTrendsChart data={moodData} />

    );
}
