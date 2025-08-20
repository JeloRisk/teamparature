// app/(admin)/dashboard/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Users, Smile, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const moodData = [
    { day: "Mon", happy: 12, neutral: 4, sad: 2 },
    { day: "Tue", happy: 8, neutral: 6, sad: 3 },
    { day: "Wed", happy: 15, neutral: 3, sad: 1 },
    { day: "Thu", happy: 10, neutral: 5, sad: 2 },
    { day: "Fri", happy: 18, neutral: 2, sad: 0 },
]

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Team Mood Dashboard</h1>
            <p className="text-muted-foreground">Overview of team well-being this week</p>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">25</div>
                        <p className="text-xs text-muted-foreground">+2 since last week</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Mood Today</CardTitle>
                        <Smile className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">😊 Happy</div>
                        <p className="text-xs text-muted-foreground">72% positive</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Trend</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+5%</div>
                        <p className="text-xs text-muted-foreground">Compared to last week</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Mood Trends This Week</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={moodData}>
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="happy" stackId="a" fill="#22c55e" />
                            <Bar dataKey="neutral" stackId="a" fill="#eab308" />
                            <Bar dataKey="sad" stackId="a" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
