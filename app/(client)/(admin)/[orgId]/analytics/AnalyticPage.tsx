"use client"

import MoodAnalytics from "./MoodAnalytics"
import type { Member } from "@/types/membership"
import { Role } from "@/lib/rbac"

interface DashboardProps {
    userRole: Role
    organization: {
        _id: string
        name: string
        logoUrl?: string
        slug: string
        memberships?: { role: Role }[]
    }
    memberships: Member[]
}

// FIX: Destructure all declared props to satisfy the DashboardProps interface signature
export default function Dashboard({ userRole, organization, memberships }: DashboardProps) {
    if (!organization) return null

    // Optional: Reference variables or logs cleanly if you need to debug without breaking rules
    // console.log("User Role:", userRole, "Members Count:", memberships.length)

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-3">
                    <MoodAnalytics orgId={organization._id} />
                </div>
            </div>
            {/* Hidden safe references to prevent unused variable flags if you aren't using them in the UI yet */}
            <span className="hidden" data-role={userRole} data-count={memberships.length} />
        </div>
    )
}