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
    iconBg = "bg-neutral-100",
    borderHoverColor = "hover:border-neutral-300",
}: StatsCardProps) {
    return (
        <div
            className={`
                group relative overflow-hidden
                rounded-[32px]
                border border-neutral-200/80
                bg-white
                p-6
                transition-all duration-300
                hover:-translate-y-1
                hover:bg-neutral-50/80
                ${borderHoverColor}
                font-[family-name:var(--font-plus-jakarta)]
            `}
        >
            {/* subtle gradient glow */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-neutral-100 blur-3xl" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
                {/* top */}
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold tracking-tight text-neutral-500">
                            {title}
                        </p>

                        <h2 className="text-5xl font-bold tracking-[-0.06em] text-neutral-900">
                            {value}
                        </h2>
                    </div>

                    {/* icon */}
                    <div
                        className={`
                            flex h-14 w-14 items-center justify-center
                            rounded-2xl
                            border border-neutral-200
                            bg-white
                            transition-all duration-300
                            group-hover:scale-105
                            ${iconBg}
                        `}
                    >
                        <Icon
                            className="h-6 w-6 text-neutral-900"
                            strokeWidth={2.3}
                        />
                    </div>
                </div>

                {/* bottom */}
                {description && (
                    <div className="mt-8 flex items-center justify-between">
                        <p className="max-w-[220px] text-sm font-medium leading-relaxed text-neutral-400">
                            {description}
                        </p>

                        <div className="h-2 w-2 rounded-full bg-neutral-300 transition-all duration-300 group-hover:bg-neutral-900" />
                    </div>
                )}
            </div>
        </div>
    )
}