"use client"

import { useEffect } from "react"
import Image from "next/image"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card"
import { Users, Crown, TrendingUp } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface Organization {
    _id: string
    name: string
    plan: string
    logoUrl?: string
    memberships?: { role: string }[]
}

interface Membership {
    role: string
    isCreator?: boolean
}

interface Props {
    organization: Organization
    membership: Membership
}

const moodData = [
    { day: "Mon", happy: 12, neutral: 4, sad: 2 },
    { day: "Tue", happy: 8, neutral: 6, sad: 3 },
    { day: "Wed", happy: 15, neutral: 3, sad: 1 },
    { day: "Thu", happy: 10, neutral: 5, sad: 2 },
    { day: "Fri", happy: 18, neutral: 2, sad: 0 },
]

export default function DashboardClient({ organization, membership }: Props) {
    const totalMembers = organization.memberships?.length || 0
    const creators = organization.memberships?.filter((m) => m.role === "creator").length || 0
    const membersOnly = totalMembers - creators

    return (
        <div className="space-y-10">
            {/* Org Header */}
            <Card className="overflow-hidden border border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <CardHeader className="flex flex-row items-center gap-4">
                    {organization.logoUrl ? (
                        <Image
                            src={organization.logoUrl}
                            alt={organization.name}
                            width={64}
                            height={64}
                            className="rounded-xl border bg-white p-1"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-xl bg-indigo-600 flex items-center justify-center text-lg font-bold text-white">
                            {organization.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <CardTitle className="text-2xl font-bold">{organization.name}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                            Plan: <span className="font-medium text-indigo-600">{organization.plan}</span>
                        </p>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats Section */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border hover:border-indigo-300 transition">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <div className="p-2 bg-indigo-100 rounded-full">
                            <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalMembers}</div>
                        <p className="text-xs text-muted-foreground">
                            {creators} creator(s), {membersOnly} member(s)
                        </p>
                    </CardContent>
                </Card>

                <Card className="border hover:border-amber-300 transition">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Creators</CardTitle>
                        <div className="p-2 bg-amber-100 rounded-full">
                            <Crown className="h-5 w-5 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{creators}</div>
                        <p className="text-xs text-muted-foreground">With creator role</p>
                    </CardContent>
                </Card>

                <Card className="border hover:border-green-300 transition">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Trend</CardTitle>
                        <div className="p-2 bg-green-100 rounded-full">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">+5%</div>
                        <p className="text-xs text-muted-foreground">Compared to last week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mood Trends */}
            <Card className="border">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Mood Trends This Week</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={moodData} barSize={24}>
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="happy" stackId="a" fill="#22c55e" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="neutral" stackId="a" fill="#eab308" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="sad" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
