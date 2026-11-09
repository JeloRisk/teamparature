"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

interface ChartCardProps {
    title: string
    children: React.ReactNode
}

export default function ChartCard({ title, children }: ChartCardProps) {
    return (
        <Card className="rounded-2xl bg-card dark:bg-card border border-border dark:border-border w-full relative">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>

            </CardHeader>
            <CardContent className="h-72">
                {children}
            </CardContent>
        </Card>
    )
}
