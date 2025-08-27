import { Mood } from "@/app/stores/useMoodStore";
import { useMemo } from "react";
import CalendarHeatmap, {
    ReactCalendarHeatmapValue,
} from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "react-calendar-heatmap/dist/styles.css";
import "react-tooltip/dist/react-tooltip.css";
import { format } from "date-fns";

type AllowedMood = 'happy' | 'excited' | 'neutral' | 'sad' | 'stressed';

interface HeatmapValue {
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

export default function MoodHeatmap({ moods }: { moods: Mood[] }) {
    const heatmapData = useMemo<HeatmapValue[]>(() => {
        return moods.map((log) => ({
            date: format(new Date(log.date), "yyyy-MM-dd"),
            mood: log.mood as AllowedMood,
        }));
    }, [moods]);

    const getClassForValue = (
        value?: ReactCalendarHeatmapValue<string> | null
    ) => {
        if (!value) return "color-empty";
        return `mood-${value.mood}`;
    };

    const tooltipDataAttrs = (
        value?: ReactCalendarHeatmapValue<string>
    ): Record<string, string> | undefined => {
        const dateStr = value?.date
            ? new Date(value.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })
            : "";

        if (!value || !value.mood) {
            return {
                "data-tooltip-id": "heatmap-tooltip",
                "data-tooltip-content": `No mood recorded${dateStr ? ` on ${dateStr}` : ""}`,
            };
        }

        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        return {
            "data-tooltip-id": "heatmap-tooltip",
            "data-tooltip-content": `${capitalize(value.mood)} on ${dateStr}`,
        };
    };

    function capitalize(s: string) {
        if (!s) return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    }


    return (
        <div className="w-full">
            <CalendarHeatmap
                startDate={new Date("2025-01-01")}
                endDate={new Date("2025-12-31")}
                values={heatmapData}
                classForValue={getClassForValue}
                tooltipDataAttrs={tooltipDataAttrs as any}
                showWeekdayLabels
                gutterSize={2}
            />

            <Tooltip id="heatmap-tooltip" />

            <style jsx global>{`
  .color-empty {
    fill: #e5e7eb !important;
  }
  .mood-happy {
    fill: #fb923c !important;
  }
  .mood-excited {
    fill: #f97316 !important;
  }
  .mood-neutral {
    fill: #a3a3a3 !important;
  }
  .mood-sad {
    fill: #60a5fa !important;
  }
  .mood-stressed {
    fill: #3b82f6 !important;
  }
`}</style>

        </div>
    );
}
