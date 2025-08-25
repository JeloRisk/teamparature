"use client"
import { Users, Crown, TrendingUp } from "lucide-react"
import OrganizationHeader from "./OrganizationHeader"
import StatsCard from "./StatsCard"
import MoodTrendsChart from "./MoodTrendsChart"
import type { Member } from "@/types/membership"
import MoodCheck from "./MoodCheck"


const moodData = [
    { day: "Mon", happy: 12, neutral: 4, sad: 2 },
    { day: "Tue", happy: 8, neutral: 6, sad: 3 },
    { day: "Wed", happy: 15, neutral: 3, sad: 1 },
    { day: "Thu", happy: 10, neutral: 5, sad: 2 },
    { day: "Fri", happy: 18, neutral: 2, sad: 0 },
]

interface DashboardProps {
    userRole: "owner" | "member"
    organization: {
        name: string
        logoUrl?: string

        slug: string
        memberships?: { role: "owner" | "member" }[]
    }
    memberships: Member[]
}
export default function Dashboard({ userRole, organization, memberships }: DashboardProps) {
    if (!organization) return null

    const totalMembers = memberships?.length || 0
    const creators = organization.memberships?.filter((m) => m.role === "owner").length || 0
    const membersOnly = totalMembers - creators

    return (
        <div className="space-y-10">
            <OrganizationHeader
                name={organization.name}
                logoUrl={organization.logoUrl}
                slug={organization.slug}
            />

            {userRole === "owner" && (
                <div className="grid gap-6 md:grid-cols-3">
                    <StatsCard
                        title="Total Members"
                        value={totalMembers}
                        description={`${creators} creator(s), ${membersOnly} member(s)`}
                        icon={Users}
                        iconBg="bg-indigo-100"
                        borderHoverColor="hover:border-indigo-300"
                    />
                    <StatsCard
                        title="Creators"
                        value={creators}
                        description="With creator role"
                        icon={Crown}
                        iconBg="bg-amber-100"
                        borderHoverColor="hover:border-amber-300"
                    />
                    <StatsCard
                        title="Trend"
                        value="+5%"
                        description="Compared to last week"
                        icon={TrendingUp}
                        iconBg="bg-green-100"
                        borderHoverColor="hover:border-green-300"
                    />
                </div>
            )}

            <MoodCheck orgId={organization.slug} userId="currentUserIdHere" />

            <MoodTrendsChart data={moodData} />
        </div>
    )
}
