"use client"
import OrganizationHeader from "./OrganizationHeader"
import MoodCheck from "./MoodCheck"
import MoodAnalytics from "./MoodAnalytics"
import StatsCard from "./StatsCard"
import { Users, Crown, TrendingUp } from "lucide-react"
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
    ownerCount: number
    memberCount: number
}

export default function Dashboard({ userRole, organization, ownerCount, memberCount }: DashboardProps) {
    if (!organization) return null

    return (
        <div className="space-y-4">
            <OrganizationHeader
                name={organization.name}
                logoUrl={organization.logoUrl}
                slug={organization._id}
            />

            <div className="grid gap-4 md:grid-cols-3">
                {/* Mood check visible to everyone */}
                <MoodCheck orgId={organization._id} />

                {userRole === "owner" && (
                    <>
                        <StatsCard
                            title="Total Members"
                            value={ownerCount + memberCount}
                            description={`${ownerCount} creator(s), ${memberCount} member(s)`}
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
                )}
                <div className="md:col-span-3">
                    <MoodAnalytics orgId={organization._id} />
                </div>
            </div>
        </div>
    )
}
