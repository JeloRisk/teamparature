"use client"
import OrganizationHeader from "./OrganizationHeader"
import MoodCheck from "./MoodCheck"
import MoodAnalytics from "./MoodAnalytics"
import StatsCard from "./StatsCard"
import { Users, Crown, TrendingUp } from "lucide-react"
import type { Member } from "@/types/membership"
import { Role } from "@/lib/rbac"
import { Mood } from "@/types/moods"
interface DashboardProps {
    userRole: Role
    organization: {
        _id: string
        name: string
        logoUrl?: string
        slug: string
        memberships?: { role: Role }[]
    }
    moods: Mood[]
    ownerMoods: Mood[]
    memberships: Member[]
}

export default function Dashboard({ userRole, organization, memberships, moods, ownerMoods }: DashboardProps) {
    if (!organization) return null

    const totalMembers = memberships?.length || 0
    const creators = organization.memberships?.filter((m) => m.role === "owner").length || 0
    const membersOnly = totalMembers - creators

    return (
        <div className="space-y-4">
            <OrganizationHeader
                name={organization.name}
                logoUrl={organization.logoUrl}
                slug={organization._id}
            />

            <div className="grid gap-4 md:grid-cols-3">
                {/* Mood check visible to everyone */}
                <MoodCheck orgId={organization._id} userId="currentUserIdHere" />

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

                        {/* Full-width Mood Analytics */}

                    </>
                )}
                <div className="md:col-span-3">
                    <MoodAnalytics orgId={organization._id} />
                </div>
            </div>
        </div>
    )
}
