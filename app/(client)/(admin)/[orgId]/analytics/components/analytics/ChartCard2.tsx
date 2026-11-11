"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

interface ChartCardProps {
    title: string
    action?: React.ReactNode
    children: React.ReactNode
}

export default function ChartCard2({ title, action, children }: ChartCardProps) {
    return (
        <Card className="relative rounded-2xl border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                {action}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}
