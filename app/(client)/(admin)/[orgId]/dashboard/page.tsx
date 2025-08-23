// app/(admin)/[orgId]/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, notFound } from "next/navigation"
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
import { useMembershipStore } from "@/app/stores/useMembershipStore"

const moodData = [
    { day: "Mon", happy: 12, neutral: 4, sad: 2 },
    { day: "Tue", happy: 8, neutral: 6, sad: 3 },
    { day: "Wed", happy: 15, neutral: 3, sad: 1 },
    { day: "Thu", happy: 10, neutral: 5, sad: 2 },
    { day: "Fri", happy: 18, neutral: 2, sad: 0 },
]

export default function AdminDashboard() {
    const { orgId } = useParams<{ orgId: string }>()
    const { organization, loading, error, fetchOrganizationDetails } = useMembershipStore()

    const [orgNotFound, setOrgNotFound] = useState(false)

    useEffect(() => {
        if (!orgId) return

        fetchOrganizationDetails(orgId).then((org) => {
            if (!org) setOrgNotFound(true)
        })

    }, [orgId, fetchOrganizationDetails])


    if (loading) return <p className="text-muted-foreground">Loading organization details...</p>
    if (error) return <p className="text-red-500">{error}</p>
    if (!organization) return null

    const totalMembers = organization.memberships?.length || 0
    const creators = organization.memberships?.filter((m) => m.role === "creator").length || 0
    const membersOnly = totalMembers - creators

    return (
        <div className="space-y-10">
            {/* Org Header */}
            <Card className="overflow-hidden border border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex items-center gap-4">
                    {organization.logoUrl ? (
                        <Image
                            src={organization.logoUrl}
                            alt={organization.name}
                            width={64}
                            height={64}
                            className="rounded-xl border bg-white p-2 shadow-sm"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-xl bg-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-sm">
                            {organization.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="flex flex-col">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            {organization.name}
                        </CardTitle>

                        <p className="text-xs mt-1 text-gray-500">
                            Slug: <span className="font-mono text-indigo-700">{organization.slug}</span>
                        </p>
                    </div>
                </CardHeader>
            </Card>


            {/* Stats Section */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Total Members */}
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

                {/* Creators */}
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

                {/* Trend */}
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
