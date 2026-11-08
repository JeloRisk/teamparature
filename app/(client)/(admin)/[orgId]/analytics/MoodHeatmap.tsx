"use client";
import dynamic from "next/dynamic"

import { useTheme } from "next-themes";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { format } from "date-fns";
import ChartCard2 from "./components/analytics/ChartCard2";

import { leadingMoods, heatmapMoods, type HeatmapCell, type HeatmapMood } from "@/lib/mood-heatmap";

const moodColors: Record<HeatmapMood, string> = {
    happy: "#fb923c",
    excited: "#f97316",
    neutral: "#a3a3a3",
    sad: "#60a5fa",
    stressed: "#3b82f6",
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
    future: boolean;
}

function groupByMonthAndWeek(cells: HeatmapCell[], year: number, asOfDate: string) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from({ length: 5 }, (_, index) => ({
        name: `Week ${index + 1}`,
        data: months.map((month, monthIndex): HeatmapDataPoint => {
            const first = index * 7 + 1;
            const last = Math.min(first + 6, new Date(year, monthIndex + 1, 0).getDate());
            const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`
            const firstKey = `${monthKey}-${String(first).padStart(2, "0")}`
            const exists = first <= last
            const future = exists && firstKey > asOfDate
            const applicable = exists && !future
            const rangeLast = applicable && asOfDate.startsWith(monthKey) ? Math.min(last, Number(asOfDate.slice(-2))) : last
            const cell = cells.find(cell => cell.month === monthIndex + 1 && cell.week === index + 1);
            const leaders = leadingMoods(cell?.counts ?? {});
            return {
                x: month,
                y: !applicable ? -1 : leaders.length > 1 ? 6 : leaders.length ? moodToNumber[leaders[0]] : 0,
                leaders,
                counts: cell?.counts ?? {},
                total: cell?.total ?? 0,
                range: !exists ? `${month} has no Week ${index + 1}` : `${format(new Date(year, monthIndex, first), "MMM d")} – ${format(new Date(year, monthIndex, applicable ? rangeLast : last), "MMM d, yyyy")}`,
                applicable,
                future,
            };
        }),
    }));
}

export default function MoodHeatmapApex({ moods, year, timezone, asOfDate, latestYear, onYearChange }: { moods: HeatmapCell[]; year: number; timezone: string; asOfDate: string; latestYear: number; onYearChange: (year: number) => void }) {
    const { resolvedTheme } = useTheme();
    const dark = resolvedTheme === "dark";
    const empty = dark ? "#29314b" : "#edf0fa";
    const label = dark ? "#a9b2d0" : "#46516e";
    const series = groupByMonthAndWeek(moods, year, asOfDate);

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
                    ranges: [{ from: -1, to: -1, color: dark ? "#343b56" : "#e1e6f2", name: "Not yet occurred" }, { from: 6, to: 6, color: dark ? "#8894bf" : "#bec8ed", name: "Tied moods" }, { from: 0, to: 0, color: empty, name: "No entry" }, ...Object.entries(moodColors).map(([mood, color]) => {
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
                if (!point.applicable) return wrap(point.future
                    ? `${heading}<br/>Not yet reached. Year-to-date data is available through ${asOfDate}.`
                    : `${heading}<br/>This month has no days in that week.`);
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
            labels: { style: { colors: label, fontSize: "12px", fontWeight: 500 } },
        },
        yaxis: { labels: { style: { colors: [label], fontSize: "12px", fontWeight: 500 } } },
    };

    return (
        <ChartCard2 title="Team Emotional Heatmap">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{year === latestYear ? "Calendar year to date" : "Calendar year"} · {year} through {asOfDate} · {timezone}. Each cell shows the most common mood that week.</p>
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    Year
                    <select aria-label="Heatmap year" value={year} onChange={event => onYearChange(Number(event.target.value))} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        {Array.from({ length: latestYear - 1999 }, (_, index) => latestYear - index).map(optionYear => <option key={optionYear} value={optionYear}>{optionYear}</option>)}
                    </select>
                </label>
            </div>
            <ul aria-label="Mood legend" className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {Object.entries(moodColors).map(([mood, color]) => <li key={mood} className="flex items-center gap-2 capitalize"><span className="size-3 rounded-sm" style={{ backgroundColor: color }} />{mood}</li>)}
                <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: dark ? "#8894bf" : "#bec8ed" }} />Tied moods</li>
                <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: empty }} />No entry</li>
                <li className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ backgroundColor: dark ? "#343b56" : "#e1e6f2" }} />Not yet occurred</li>
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
