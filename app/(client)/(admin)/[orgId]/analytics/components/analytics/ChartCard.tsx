"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

interface ChartCardProps {
    title: string
    description?: string
    contentClassName?: string
    cardClassName?: string
    action?: React.ReactNode
    children: React.ReactNode
}

export default function ChartCard({ title, description, contentClassName = "h-56 sm:h-72", cardClassName = "", action, children }: ChartCardProps) {
    return (
        <Card className={`relative min-w-0 w-full rounded-2xl border border-border bg-card dark:border-border dark:bg-card ${cardClassName}`}>
            <CardHeader className={`px-4 sm:px-6 ${action ? "flex flex-col items-start gap-3" : ""}`}>
                <CardTitle className="text-base font-semibold leading-6 sm:text-lg">{title}</CardTitle>
                {description && <CardDescription className="text-sm leading-5">{description}</CardDescription>}
                {action}
            </CardHeader>
            <CardContent className={`min-w-0 px-4 sm:px-6 ${contentClassName}`}>
                {children}
            </CardContent>
        </Card>
    )
}
