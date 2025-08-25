"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
} from "recharts"

interface MoodTrendsChartProps {
    data: { day: string; happy: number; neutral: number; sad: number }[]
}

export default function MoodTrendsChart({ data }: MoodTrendsChartProps) {
    return (
        <Card className="border shadow-sm hover:shadow-md transition">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                    Mood Trends This Week
                </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        barCategoryGap="25%" // controls spacing between bars
                        margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                    >
                        {/* Background grid */}
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                        {/* Axis styling */}
                        <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />

                        {/* Modern tooltip */}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                                fontSize: "13px",
                            }}
                        />

                        {/* Legend for clarity */}
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13 }} />

                        {/* Bars with auto width + rounded top */}
                        <Bar dataKey="happy" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="neutral" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="sad" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
