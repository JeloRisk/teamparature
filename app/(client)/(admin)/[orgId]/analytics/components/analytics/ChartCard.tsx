"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

interface ChartCardProps {
    title: string
    children: React.ReactNode
}

export default function ChartCard({ title, children }: ChartCardProps) {
    return (
        <Card className="relative min-w-0 w-full rounded-2xl border border-border bg-card dark:border-border dark:bg-card">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>

            </CardHeader>
            <CardContent className="h-72 min-w-0 px-3 sm:px-6">
                {children}
            </CardContent>
        </Card>
    )
}
