"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

interface ChartCardProps {
    title: string
    description?: string
    contentClassName?: string
    action?: React.ReactNode
    children: React.ReactNode
}

export default function ChartCard({ title, description, contentClassName = "h-72", action, children }: ChartCardProps) {
    return (
        <Card className="relative min-w-0 w-full rounded-2xl border border-border bg-card dark:border-border dark:bg-card">
            <CardHeader className={action ? "flex flex-col items-start gap-3" : undefined}>
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
