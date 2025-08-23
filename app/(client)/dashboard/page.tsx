"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMembershipStore } from "@/app/stores/useMembershipStore"

export default function DashboardPage() {
    const router = useRouter()
    const { memberships, fetchMemberships, loading } = useMembershipStore()

    // Fetch memberships once on mount
    useEffect(() => {
        fetchMemberships()
    }, [fetchMemberships])

    // Redirect when memberships are loaded
    useEffect(() => {
        if (loading) return
        if (memberships.length === 0) return

        const owners = memberships.filter((m) => m.role === "owner")
        const others = memberships.filter((m) => m.role !== "owner")

        const sortByName = (a: any, b: any) =>
            a.organization.name.localeCompare(b.organization.name)

        let chosen
        if (owners.length > 0) {
            chosen = owners.sort(sortByName)[0]
        } else {
            chosen = others.sort(sortByName)[0]
        }

        if (chosen) {
            router.replace(`/${chosen.organization._id}/dashboard`)
        }
    }, [memberships, loading, router])

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
    )
}
