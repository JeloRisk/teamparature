"use client"

import { LucideIcon } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    iconBg?: string
    borderHoverColor?: string
}

export default function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    iconBg = "bg-orange-100",
    borderHoverColor = "hover:border-orange-300",
}: StatsCardProps) {
    return (
        <div
            className={`
                relative overflow-hidden
                rounded-3xl border border-gray-200/80
                bg-white
                p-5
                transition-all duration-300
                ${borderHoverColor}
            `}
        >
            {/* subtle background accent */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gray-100/70 blur-2xl" />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium tracking-tight text-gray-500">
                        {title}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                        {value}
                    </h2>

                    {description && (
                        <p className="mt-2 text-xs font-medium text-gray-400">
                            {description}
                        </p>
                    )}
                </div>

                <div
                    className={`
                        flex h-12 w-12 items-center justify-center
                        rounded-2xl
                        ${iconBg}
                    `}
                >
                    <Icon className="h-5 w-5 text-gray-900" />
                </div>
            </div>
        </div>
    )
}