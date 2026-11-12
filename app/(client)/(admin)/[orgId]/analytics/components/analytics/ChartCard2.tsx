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
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
                <CardTitle className="min-w-0 text-[15px] font-semibold leading-5 tracking-tight sm:text-lg">{title}</CardTitle>
                {action}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}
