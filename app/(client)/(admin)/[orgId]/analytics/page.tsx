"use client"
import { useParams } from "next/navigation"
import Dashboard from "./AnalyticPage"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"
import { useEffect } from "react"
import { Skeleton } from "@/app/components/ui/skeleton"

export default function AdminDashboardPage() {
    const { orgId } = useParams<{ orgId: string }>()
    const { organization, membership, memberships, loading, fetchOrganizationDetails } = useOrgStore()

    // Fetch once on mount
    useEffect(() => {
        if (!orgId) return
        fetchOrganizationDetails(orgId)
    }, [orgId, fetchOrganizationDetails])

    const renderSkeleton = () => (
        <div className="space-y-6">
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

    if (loading || !membership || !organization) {
        return renderSkeleton()
    }


    // Derive role directly
    const userRole = membership.role as "owner" | "member"

    return <Dashboard userRole={userRole} organization={organization} memberships={memberships} />
}
