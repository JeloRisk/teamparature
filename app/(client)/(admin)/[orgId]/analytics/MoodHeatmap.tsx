"use client";

import React from "react";
import ReactApexChart from "react-apexcharts";
import { format, startOfWeek, addDays } from "date-fns";
import ChartCard2 from "./components/analytics/ChartCard2";

type AllowedMood = "happy" | "excited" | "neutral" | "sad" | "stressed";

interface MoodEntry {
    date: string; // yyyy-MM-dd
    mood: AllowedMood;
}

const moodColors: Record<AllowedMood, string> = {
    happy: "#fb923c",
    excited: "#f97316",
    neutral: "#a3a3a3",
    sad: "#60a5fa",
    stressed: "#3b82f6",
};

const moodToNumber: Record<AllowedMood, number> = {
    happy: 1,
    excited: 2,
    neutral: 3,
    sad: 4,
    stressed: 5,
};

const numberToMood: Record<number, AllowedMood> = {
    1: "happy",
    2: "excited",
    3: "neutral",
    4: "sad",
    5: "stressed",
};

function groupByMonthAndWeek(moods: MoodEntry[]) {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const series: {
        name: string;
        data: { x: string; y: number; mood?: AllowedMood; range?: string }[];
    }[] = [];

    for (let week = 1; week <= 5; week++) {
        const row = {
            name: `Week ${week}`,
            data: months.map((month, idx) => {
                const monthEntries = moods.filter(
                    (m) => new Date(m.date).getMonth() === idx
                );

                const weekEntries = monthEntries.filter((m) => {
                    const d = new Date(m.date).getDate();
                    return d > (week - 1) * 7 && d <= week * 7;
                });

                if (weekEntries.length > 0) {
                    const mood = weekEntries[0].mood;
                    const startDate = startOfWeek(
                        new Date(2025, idx, (week - 1) * 7 + 1),
                        { weekStartsOn: 1 }
                    );
                    const endDate = addDays(startDate, 6);

                    return {
                        x: month,
                        y: moodToNumber[mood], // numeric encoding
                        mood,
                        range: `${format(startDate, "MMM d")} - ${format(endDate, "d")}`,
                    };
                }

                return { x: month, y: 0 };
            }),
        };
        series.push(row);
    }

    return series;
}

export default function MoodHeatmapApex({ moods }: { moods: MoodEntry[] }) {
    const series = groupByMonthAndWeek(moods);

    const options: ApexCharts.ApexOptions = {
        chart: { type: "heatmap", toolbar: { show: false } },
        dataLabels: { enabled: false },
        colors: ["#e5e7eb"], // fallback
        plotOptions: {
            heatmap: {
                colorScale: {
                    ranges: Object.entries(moodColors).map(([mood, color]) => {
                        const val = moodToNumber[mood as AllowedMood];
                        return {
                            from: val,
                            to: val,
                            color,
                            name: mood,
                        };
                    }),
                },
            },
        },
        tooltip: {
            custom: function ({ seriesIndex, dataPointIndex, w }) {
                const point =
                    w.config.series[seriesIndex].data[dataPointIndex] as any;
                if (!point.mood) {
                    return `<div>No mood recorded</div>`;
                }
                return `<div>
          <strong>${point.range}</strong><br/>
          Mood: ${point.mood.charAt(0).toUpperCase() + point.mood.slice(1)}
        </div>`;
            },
        },
        xaxis: { categories: series[0].data.map((d) => d.x) },
    };

    return (
        <ChartCard2 title="Team Emotional Heatmap">
            <ReactApexChart
                options={options}
                series={series}
                type="heatmap"
                height={350}
            />
        </ChartCard2>
    );
}
