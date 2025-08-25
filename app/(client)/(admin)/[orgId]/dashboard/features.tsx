// dashboard/features.ts
import { Users, TrendingUp } from "lucide-react"
import StatsCard from "./StatsCard"
import MoodCheck from "./MoodCheck"
import MoodAnalytics from "./MoodAnalytics"

export const dashboardFeatures = [
    {
        key: "mood-check",
        permission: "check_mood",
        render: (orgId: string, userId: string) => (
            <MoodCheck orgId={orgId} userId={userId} />
        ),
    },
    {
        key: "members-card",
        permission: "view_members",
        render: (orgId: string, userId: string, ctx: { totalMembers: number, creators: number, membersOnly: number }) => (
            <StatsCard
                title="Total Members"
                value={ctx.totalMembers}
                description={`${ctx.creators} creator(s), ${ctx.membersOnly} member(s)`
                }
                icon={Users}
                iconBg="bg-indigo-100"
                borderHoverColor="hover:border-indigo-300"
            />
        ),
    },
    {
        key: "trend-card",
        permission: "view_analytics",
        render: () => (
            <StatsCard
                title="Trend"
                value="+5%"
                description="Compared to last week"
                icon={TrendingUp}
                iconBg="bg-green-100"
                borderHoverColor="hover:border-green-300"
            />
        ),
    },
    {
        key: "mood-analytics",
        permission: "view_analytics",
        render: (orgId: string) => <MoodAnalytics orgId={orgId} />,
    },
]
