"use client"

import MoodAnalytics from "./MoodAnalytics"
import { Users, Crown, TrendingUp } from "lucide-react"
import type { Member } from "@/types/membership"
import { Role } from "@/lib/rbac"

interface DashboardProps {
    userRole: Role
    organization: {
        _id: string
        name: string
        logoUrl?: string
        slug: string
        memberships?: { role: Role }[]
    }
    memberships: Member[]
}

export default function Dashboard({ userRole, organization, memberships }: DashboardProps) {
    if (!organization) return null

    const totalMembers = memberships?.length || 0
    const creators = organization.memberships?.filter((m) => m.role === "owner").length || 0
    const membersOnly = totalMembers - creators

    return (
        <div className="space-y-4">

            <div className="grid gap-4 md:grid-cols-3">
                {/* <MoodCheck orgId={organization._id} userId="currentUserIdHere" />

                {userRole === "owner" && (
                    <>
                        <StatsCard
                            title="Total Members"
                            value={totalMembers}
                            description={`${creators} creator(s), ${membersOnly} member(s)`}
                            icon={Users}
                            iconBg="bg-indigo-100"
                            borderHoverColor="hover:border-indigo-300"
                        />

                        <StatsCard
                            title="Trend"
                            value="+5%"
                            description="Compared to last week"
                            icon={TrendingUp}
                            iconBg="bg-green-100"
                            borderHoverColor="hover:border-green-300"
                        />


                    </>
                )} */}
                <div className="md:col-span-3">
                    <MoodAnalytics orgId={organization._id} />
                </div>
            </div>
        </div>
    )
}
