"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMembershipStore } from "@/app/stores/useMembershipStore"

export default function DashboardPage() {
    const router = useRouter()
    const { memberships, fetchMemberships, loading, error } = useMembershipStore()
    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                await fetchMemberships()
            } catch (err: any) {
                console.error("Failed to load memberships:", err)
                setLocalError(err.message || "Failed to load memberships")
            }
        }
        load()
    }, [fetchMemberships])

    useEffect(() => {
        if (loading) return
        if (localError) return
        if (!memberships || memberships.length === 0) return

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
    }, [memberships, loading, localError, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
        )
    }

    if (localError || !memberships || memberships.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-red-600 font-medium">
                    {localError || "No memberships found or access denied."}
                </p>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={() => fetchMemberships().catch(() => setLocalError("Retry failed"))}
                >
                    Retry
                </button>
            </div>
        )
    }

    return null 
}
