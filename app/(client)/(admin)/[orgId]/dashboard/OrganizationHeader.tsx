"use client"
import Image from "next/image"
import { Card, CardHeader, CardTitle } from "@/app/components/ui/card"

interface OrganizationHeaderProps {
    name: string
    logoUrl?: string
    slug: string
}

export default function OrganizationHeader({ name, logoUrl, slug }: OrganizationHeaderProps) {
    return (
        <Card className="overflow-hidden border border-indigo-200 hover:border-indigo-300 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 transition-shadow">
            <CardHeader className="flex items-center gap-4">
                {logoUrl ? (
                    <Image
                        src={logoUrl}
                        alt={name}
                        width={64}
                        height={64}
                        className="rounded-xl border bg-white p-2 shadow-sm"
                    />
                ) : (
                    <div className="h-16 w-16 rounded-xl bg-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-sm">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex flex-col">
                    <CardTitle className="text-2xl font-bold text-gray-900">{name}</CardTitle>
                    <p className="text-xs mt-1 text-gray-500">
                        Slug: <span className="font-mono text-indigo-700">{slug}</span>
                    </p>
                </div>
            </CardHeader>
        </Card>
    )
}
