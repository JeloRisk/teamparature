"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const data = [
    { name: "Happy", value: 45 },
    { name: "Neutral", value: 25 },
    { name: "Sad", value: 15 },
    { name: "Stressed", value: 10 },
    { name: "Excited", value: 5 },
]

const COLORS = ["#f97316", "#fde047", "#0ea5e9", "#7c3aed", "#22c55e"]

export default function MoodDistribution() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">Mood Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" label>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
