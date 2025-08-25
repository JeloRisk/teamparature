"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    iconBg?: string
    borderHoverColor?: string
}

export default function StatsCard({ title, value, description, icon: Icon, iconBg = "bg-gray-100", borderHoverColor = "hover:border-gray-300" }: StatsCardProps) {
    return (
        <Card className={`border ${borderHoverColor} transition`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <div className={`p-2 rounded-full ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    )
}
