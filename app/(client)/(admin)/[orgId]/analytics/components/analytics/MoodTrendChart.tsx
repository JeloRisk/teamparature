"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
    { date: "Mon", happy: 20, sad: 5 },
    { date: "Tue", happy: 18, sad: 8 },
    { date: "Wed", happy: 25, sad: 4 },
    { date: "Thu", happy: 22, sad: 6 },
    { date: "Fri", happy: 30, sad: 3 },
]

export default function MoodTrendChart() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">Mood Trends</h2>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="happy" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sad" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
