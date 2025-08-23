"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMembershipStore } from "@/app/stores/useMembershipStore"
export default function DashboardPage() {
    const router = useRouter()
    const { memberships, fetchMemberships, loading } = useMembershipStore()

    useEffect(() => {
        const load = async () => {
            await fetchMemberships()

            if (!loading && memberships.length > 0) {
                // Separate owners and members
                const owners = memberships.filter((m) => m.role === "owner")
                const others = memberships.filter((m) => m.role !== "owner")

                // Sort alphabetically by organization name
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
            }
        }

        load()
    }, [fetchMemberships, memberships, loading, router])

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
    )
}
