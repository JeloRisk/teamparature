"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface MoodTrendsChartProps {
    data: { day: string; happy: number; neutral: number; sad: number }[]
}

export default function MoodTrendsChart({ data }: MoodTrendsChartProps) {
    return (
        <Card className="border">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Mood Trends This Week</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={24}>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="happy" stackId="a" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="neutral" stackId="a" fill="#eab308" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="sad" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
