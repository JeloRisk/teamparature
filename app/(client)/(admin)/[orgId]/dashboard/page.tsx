"use client"

import { useParams } from "next/navigation"
import Dashboard from "./Dashboard"
import MyMoodDashboard from "./MyMoodDashboard"
import { useEffect } from "react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"
import { useMoodStore } from "@/app/stores/useMoodStore"
import { useMyMood } from "@/app/stores/useMyMood"

export default function AdminDashboardPage() {
    const { orgId } = useParams<{ orgId: string }>()

    const organization = useOrgStore(state => state.organization)
    const membership = useOrgStore(state => state.membership)
    const memberships = useOrgStore(state => state.memberships)
    const loadingOrg = useOrgStore(state => state.loading)
    const fetchOrganizationDetails = useOrgStore(state => state.fetchOrganizationDetails)

    const loadingMood = useMoodStore(state => state.loadingMood)
    const fetchAllMoods = useMoodStore(state => state.fetchAllMoods)

    const analytics = useMyMood(state => state.analytics)
    const loadingAnalytics = useMyMood(state => state.loading)
    const fetchMyMoodAnalytics = useMyMood(state => state.fetchMyMoodAnalytics)

    // Fetch org + moods + analytics when orgId changes
    useEffect(() => {
        if (!orgId) return
        
        fetchOrganizationDetails(orgId)
        fetchAllMoods(orgId)
        fetchMyMoodAnalytics() 
    }, [orgId, fetchOrganizationDetails, fetchAllMoods, fetchMyMoodAnalytics])

    // Render skeleton while loading any component dependencies
    if (loadingOrg || loadingMood || loadingAnalytics || !membership || !organization) {
        return (
            <div className="space-y-6 p-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-28 rounded-xl" />
                    <Skeleton className="h-28 rounded-xl" />
                    <Skeleton className="h-28 rounded-xl" />
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            </div>
        )
    }

    // Derive role
    const userRole = membership.role as "owner" | "member"

    return (
        <div className="space-y-6 flex-1 bg-[#e8e8e8] min-h-screen pb-12">
            {/* Render the analytics analytics block side-by-side above team details */}
            <MyMoodDashboard prepopulatedAnalytics={analytics} />

            {/* Standard workspace summary display — Cleaned of unused mood variables */}
            <Dashboard
                userRole={userRole}
                organization={organization}
                memberships={memberships}
            />
        </div>
    )
}