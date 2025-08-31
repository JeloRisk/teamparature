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
    data: {
        day: string
        happy: number
        neutral: number
        sad: number
        stressed: number
        excited: number
    }[]
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
                        barCategoryGap="25%"
                        margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                        <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                                fontSize: "13px",
                            }}
                        />

                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13 }} />

                        <Bar dataKey="happy" stackId="a" fill="#22c55e" />
                        <Bar dataKey="neutral" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="sad" stackId="a" fill="#ef4444" />
                        <Bar dataKey="stressed" stackId="a" fill="#facc15" />
                        <Bar dataKey="excited" stackId="a" fill="#a855f7" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
