"use client";
import dynamic from "next/dynamic"

import { useTheme } from "next-themes";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { format } from "date-fns";
import ChartCard2 from "./components/analytics/ChartCard2";

import { leadingMoods, heatmapMoods, type HeatmapCell, type HeatmapMood } from "@/lib/mood-heatmap";

const moodColors: Record<HeatmapMood, string> = {
    happy: "#e9bb85",
    excited: "#e8a4bb",
    neutral: "#bfc5d6",
    sad: "#b7a4dc",
    stressed: "#ead082",
};

const moodToNumber: Record<HeatmapMood, number> = {
    happy: 1,
    excited: 2,
    neutral: 3,
    sad: 4,
    stressed: 5,
};
interface HeatmapDataPoint {
    x: string;
    y: number;
    leaders: HeatmapMood[];
    counts: HeatmapCell["counts"];
    total: number;
    range: string;
    applicable: boolean;
}

function groupByMonthAndWeek(cells: HeatmapCell[], year: number) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from({ length: 5 }, (_, index) => ({
        name: `Week ${index + 1}`,
        data: months.map((month, monthIndex): HeatmapDataPoint => {
            const first = index * 7 + 1;
            const last = Math.min(first + 6, new Date(year, monthIndex + 1, 0).getDate());
            const applicable = first <= last;
            const cell = cells.find(cell => cell.month === monthIndex + 1 && cell.week === index + 1);
            const leaders = leadingMoods(cell?.counts ?? {});
            return {
                x: month,
                y: !applicable ? -1 : leaders.length > 1 ? 6 : leaders.length ? moodToNumber[leaders[0]] : 0,
                leaders,
                counts: cell?.counts ?? {},
                total: cell?.total ?? 0,
                range: applicable ? `${format(new Date(year, monthIndex, first), "MMM d")} – ${format(new Date(year, monthIndex, last), "MMM d, yyyy")}` : `${month} ${year}`,
                applicable,
            };
        }),
    }));
}

export default function MoodHeatmapApex({ moods, year, timezone }: { moods: HeatmapCell[]; year: number; timezone: string }) {
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
                    ranges: [{ from: -1, to: -1, color: dark ? "#1e2438" : "#fcfcff", name: "Not applicable" }, { from: 6, to: 6, color: dark ? "#8894bf" : "#bec8ed", name: "Tied moods" }, { from: 0, to: 0, color: empty, name: "No entry" }, ...Object.entries(moodColors).map(([mood, color]) => {
                        const val = moodToNumber[mood as HeatmapMood];
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
                const heading = `<strong>${point.range}</strong>`;
                const wrap = (content: string) => `<div style="max-width:260px;padding:12px;background:var(--popover);color:var(--popover-foreground);line-height:1.7">${content}</div>`;
                if (!point.applicable) return wrap(`${heading}<br/>This month has no days in Week 5.`);
                if (!point.total) return wrap(`${heading}<br/>No check-ins recorded.`);
                const title = point.leaders.length > 1 ? "Tied most common moods" : "Most common mood";
                const leaders = point.leaders.map(mood => mood.charAt(0).toUpperCase() + mood.slice(1)).join(", ");
                const breakdown = heatmapMoods.map(mood => `${mood.charAt(0).toUpperCase() + mood.slice(1)}: ${point.counts[mood] ?? 0}`).join("<br/>");
                return wrap(`${heading}<br/>${title}: ${leaders}<br/>${point.total} check-in${point.total === 1 ? "" : "s"}<br/>${breakdown}`);

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
            <p className="mb-3 text-xs text-muted-foreground">{year} · {timezone} · Each cell shows the most common mood across all check-ins. Week 1 covers days 1–7; Week 5 covers the remaining days.</p>
            <ul aria-label="Mood legend" className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {Object.entries(moodColors).map(([mood, color]) => <li key={mood} className="flex items-center gap-2 capitalize"><span className="size-3 rounded-sm" style={{ backgroundColor: color }} />{mood}</li>)}
                <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: dark ? "#8894bf" : "#bec8ed" }} />Tied moods</li>
                <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: empty }} />No entry</li>
            </ul>
            <div className="w-full min-w-0 overflow-hidden">
            <ReactApexChart
                options={options}
                series={series}
                type="heatmap"
                height={350}
            />
            </div>
        </ChartCard2>
    );
}
