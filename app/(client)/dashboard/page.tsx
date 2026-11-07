"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMembershipStore } from "@/app/stores/useMembershipStore"

export default function DashboardPage() {
    const router = useRouter()
    const { memberships, fetchMemberships, loading, error } = useMembershipStore()
    const [loaded, setLoaded] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                await fetchMemberships();
            } catch (err: unknown) {
                console.error("Failed to load memberships:", err);

                if (err instanceof Error) {
                    setLocalError(err.message);
                } else {
                    setLocalError("Failed to load memberships");
                }
            } finally {
                setLoaded(true)
            }
        };
        load();
    }, [fetchMemberships]);


    useEffect(() => {
        if (!loaded || loading || error) return
        if (localError) return
        if (memberships.length === 0) {
            router.replace("/onboarding")
            return
        }

        const owners = memberships.filter((m) => m.role === "owner")
        const others = memberships.filter((m) => m.role !== "owner")
        const sortByName = (
            a: { organization: { name: string } },
            b: { organization: { name: string } }
        ) => a.organization.name.localeCompare(b.organization.name)

        let chosen
        if (owners.length > 0) {
            chosen = owners.sort(sortByName)[0]
        } else {
            chosen = others.sort(sortByName)[0]
        }

        if (chosen) {
            router.replace(`/${chosen.organization._id}`)
        }
    }, [memberships, loaded, loading, error, localError, router])

    if (!loaded || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
        )
    }

    if (localError || error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-red-600 dark:text-[#eea09a] font-medium">
                    {localError || error}
                </p>
                <button
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary transition"
                    onClick={() => { setLocalError(null); fetchMemberships() }}
                >
                    Retry
                </button>
            </div>
        )
    }

    return null
}
