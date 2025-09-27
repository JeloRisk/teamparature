"use client"

import { useParams } from "next/navigation"
import Dashboard from "./Dashboard"
import { useEffect } from "react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"
import { useMoodStore } from "@/app/stores/useMoodStore"

export default function AdminDashboardPage() {
    const { orgId } = useParams<{ orgId: string }>()

    const organization = useOrgStore(state => state.organization)
    const membership = useOrgStore(state => state.membership)
    const memberships = useOrgStore(state => state.memberships)
    const loadingOrg = useOrgStore(state => state.loading)
    const fetchOrganizationDetails = useOrgStore(state => state.fetchOrganizationDetails)

    const moods = useMoodStore(state => state.moods)
    const ownerMoods = useMoodStore(state => state.ownerMoods)
    const loadingMood = useMoodStore(state => state.loadingMood)
    const fetchAllMoods = useMoodStore(state => state.fetchAllMoods)

    // Fetch org + moods once when orgId changes
    useEffect(() => {
        if (!orgId) return
        fetchOrganizationDetails(orgId)
        fetchAllMoods(orgId)
        console.log("Hello")

    }, [orgId, fetchOrganizationDetails, fetchAllMoods])

    // Render skeleton while loading
    if (loadingOrg || loadingMood || !membership || !organization) {
        return (
            <div className="space-y-6">
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
        <Dashboard
            userRole={userRole}
            organization={organization}
            memberships={memberships}
            moods={moods}
            ownerMoods={ownerMoods}
        />
    )
}
