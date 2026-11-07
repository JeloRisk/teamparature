"use client";
import dynamic from "next/dynamic"

import { useTheme } from "next-themes";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { format } from "date-fns";
import ChartCard2 from "./components/analytics/ChartCard2";

type AllowedMood = "happy" | "excited" | "neutral" | "sad" | "stressed";

interface MoodEntry {
    month: number;
    day: number;
    mood: AllowedMood;
}

const moodColors: Record<AllowedMood, string> = {
    happy: "#e9bb85",
    excited: "#e8a4bb",
    neutral: "#bfc5d6",
    sad: "#b7a4dc",
    stressed: "#ead082",
};

const moodToNumber: Record<AllowedMood, number> = {
    happy: 1,
    excited: 2,
    neutral: 3,
    sad: 4,
    stressed: 5,
};
interface HeatmapDataPoint {
    x: string;
    y: number;
    mood?: AllowedMood;
    range?: string;
}


function groupByMonthAndWeek(moods: MoodEntry[], year: number) {
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
                    (m) => m.month === idx + 1
                );

                const weekEntries = monthEntries.filter((m) => {
                    const d = m.day;
                    return d > (week - 1) * 7 && d <= week * 7;
                });

                if (weekEntries.length > 0) {
                    const mood = weekEntries[0].mood;
                    const startDate = new Date(year, idx, (week - 1) * 7 + 1);
                    const endDate = new Date(year, idx, Math.min(week * 7, new Date(year, idx + 1, 0).getDate()));

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

export default function MoodHeatmapApex({ moods, year }: { moods: MoodEntry[]; year: number }) {
    const { resolvedTheme } = useTheme();
    const dark = resolvedTheme === "dark";
    const empty = dark ? "#29314b" : "#edf0fa";
    const label = dark ? "#a9b2d0" : "#626d91";
    const series = groupByMonthAndWeek(moods, year);

    const options: ApexCharts.ApexOptions = {
        chart: { type: "heatmap", toolbar: { show: false }, background: "transparent", foreColor: label },
        theme: { mode: dark ? "dark" : "light" },
        legend: { show: false },
        stroke: { width: 3, colors: [dark ? "#1e2438" : "#fcfcff"] },
        grid: { show: false },
        dataLabels: { enabled: false },
        colors: [empty],
        plotOptions: {
            heatmap: {
                enableShades: false,
                radius: 5,
                colorScale: {
                    ranges: [{ from: 0, to: 0, color: empty, name: "No entry" }, ...Object.entries(moodColors).map(([mood, color]) => {
                        const val = moodToNumber[mood as AllowedMood];
                        return {
                            from: val,
                            to: val,
                            color,
                            name: mood,
                        };
                    })],
                },
            },
        },
        tooltip: {
            custom: function ({ seriesIndex, dataPointIndex, w }) {
                const point = w.config.series[seriesIndex].data[dataPointIndex] as HeatmapDataPoint;
                if (!point.mood) {
                    return `<div style="padding:10px 12px;background:var(--popover);color:var(--popover-foreground)">No mood recorded</div>`;
                }
                return `<div style="padding:10px 12px;background:var(--popover);color:var(--popover-foreground)">
      <strong>${point.range}</strong><br/>
      Mood: ${point.mood.charAt(0).toUpperCase() + point.mood.slice(1)}
    </div>`;
            },
        },

        xaxis: {
            categories: series[0].data.map((d) => d.x),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: label } },
        },
        yaxis: { labels: { style: { colors: [label] } } },
    };

    return (
        <ChartCard2 title="Team Emotional Heatmap">
            <p className="mb-3 text-xs text-muted-foreground">{year} · Week 1 covers days 1–7, through Week 5 for days 29–31.</p>
            <ul aria-label="Mood legend" className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {Object.entries(moodColors).map(([mood, color]) => <li key={mood} className="flex items-center gap-2 capitalize"><span className="size-3 rounded-sm" style={{ backgroundColor: color }} />{mood}</li>)}
                <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: empty }} />No entry</li>
            </ul>
            <div className="overflow-x-auto"><div className="min-w-[620px]">
            <ReactApexChart
                options={options}
                series={series}
                type="heatmap"
                height={350}
            />
            </div></div>
        </ChartCard2>
    );
}
