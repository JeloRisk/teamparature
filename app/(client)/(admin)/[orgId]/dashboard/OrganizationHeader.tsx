"use client"

import Image from "next/image"
import { Card, CardHeader, CardTitle } from "@/app/components/ui/card"

interface OrganizationHeaderProps {
    name: string
    logoUrl?: string
    slug: string
}

export default function OrganizationHeader({
    name,
    logoUrl,
    slug,
}: OrganizationHeaderProps) {
    return (
        <Card className="relative overflow-hidden border rounded-[32px] my-4 border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:border-indigo-300 transition-shadow">

            {/* background illustration */}
            <div className="absolute inset-y-0 right-0 hidden md:block w-[320px] opacity-90">
                <Image
                    src="/bg.png"
                    alt="Background Illustration"
                    fill
                    className="object-contain object-right"
                    priority
                />
            </div>

            <CardHeader className="relative z-10 flex items-center gap-4">
                {logoUrl ? (
                    <Image
                        src={logoUrl}
                        alt={name}
                        width={64}
                        height={64}
                        className="rounded-2xl border bg-white p-2 shadow-sm"
                    />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-sm">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="flex flex-col">
                    <CardTitle className="text-3xl font-bold text-gray-900">
                        {name}
                    </CardTitle>

                    <p className="mt-1 text-sm text-gray-600">
                        Slug:{" "}
                        <span className="font-mono text-indigo-700">
                            {slug}
                        </span>
                    </p>
                </div>
            </CardHeader>
        </Card>
    )
}