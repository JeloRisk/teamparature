"use client"
import { useParams } from "next/navigation"
import Dashboard from "./Dashboard"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"
import { useEffect } from "react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useMoodStore } from "@/app/stores/useMoodStore"

export default function AdminDashboardPage() {
    const { orgId } = useParams<{ orgId: string }>()
    const { organization, membership, memberships, loading: loadingOrg, fetchOrganizationDetails } = useOrgStore()
    const { moods, ownerMoods, loadingMood, fetchAllMoods } = useMoodStore()

    // Fetch org + moods
    useEffect(() => {
        if (!orgId) return
        fetchOrganizationDetails(orgId)
        fetchAllMoods(orgId)
    }, [orgId, fetchOrganizationDetails, fetchAllMoods])

    const renderSkeleton = () => (
        <div className="space-y-6">
            {/* Dashboard header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" /> {/* Title placeholder */}
                <Skeleton className="h-9 w-24 rounded-lg" /> {/* Button placeholder */}
            </div>

            {/* Stats cards */}
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

    // Wait for BOTH org + moods
    if (loadingOrg || loadingMood || !membership || !organization) {
        return renderSkeleton()
    }

    // Derive role directly
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
