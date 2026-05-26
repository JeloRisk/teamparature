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
import { ThermometerSun } from "lucide-react"

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
<Card className="relative overflow-hidden border-0 rounded-3xl bg-gradient-to-br from-sky-100 via-cyan-50 to-orange-50 shadow-md transition hover:shadow-xl">
             
            {/* soft glowing background */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-200/40 blur-3xl" />

            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className=" font-semibold font-[22px] font-[family-name:var(--font-plus-jakarta)] text-gray-900">
                        Mood Temperature Trendsssss
                    </CardTitle>

                    <p className="mt-1 text-sm text-gray-700">
                        Emotional climate throughout the week
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-sm backdrop-blur">
                    <ThermometerSun className="h-5 w-5 text-orange-500" />
                </div>
            </CardHeader>

            <CardContent className="relative z-10 h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        barCategoryGap="25%"
                        margin={{ top: 20, right: 10, left: -10, bottom: 10 }}
                    >
                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="#d1d5db"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="day"
                            tick={{
                                fill: "#1f2937",
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                            axisLine={false}
                            tickLine={false}
                        />

                        <YAxis
                            tick={{
                                fill: "#1f2937",
                                fontSize: 12,
                                fontWeight: 500,
                            }}
                            axisLine={false}
                            tickLine={false}
                        />

                        <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.3)" }}
                            contentStyle={{
                                backgroundColor: "rgba(255,255,255,0.95)",
                                borderRadius: "14px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                color: "#111827",
                                fontSize: "13px",
                            }}
                            labelStyle={{
                                color: "#111827",
                                fontWeight: 700,
                            }}
                        />

                    <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => (
                            <span
                                style={{
                                    color: "#111827",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                }}
                            >
                                {value}
                            </span>
                        )}
                    />

                        {/* temperature inspired colors */}
<Bar
    dataKey="happy"
    stackId="a"
    fill="#00d26a" // vivid health green
    radius={[8, 8, 8, 8]}
/>

<Bar
    dataKey="neutral"
    stackId="a"
    fill="#00c2ff" // neon sky blue
    radius={[8, 8, 8, 8]}
/>

<Bar
    dataKey="sad"
    stackId="a"
    fill="#7a5cff" // vibrant purple
    radius={[8, 8, 8, 8]}
/>

<Bar
    dataKey="stressed"
    stackId="a"
    fill="#ffb800" // smartwatch amber
    radius={[8, 8, 8, 8]}
/>

<Bar
    dataKey="excited"
    stackId="a"
    fill="#ff2d8d" // energetic pink
    radius={[8, 8, 8, 8]}
/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}