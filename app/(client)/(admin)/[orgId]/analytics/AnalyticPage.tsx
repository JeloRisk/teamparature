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

export default function Dashboard({ organization, memberships }: DashboardProps) {
    if (!organization) return null
    console.log(memberships)

    return (
        <div className="space-y-4">

            <div className="grid gap-4 md:grid-cols-3">

                <div className="md:col-span-3">
                    <MoodAnalytics orgId={organization._id} />
                </div>
            </div>
        </div>
    )
}
