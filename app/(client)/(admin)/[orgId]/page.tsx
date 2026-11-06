"use client"

import { useEffect } from "react"
import { useMoodStore } from "@/app/stores/useMoodStore"
import { useWorkspace } from "./ClientDashboardLayout"
import MemberDashboard from "./dashboard/MemberDashboard"
import Dashboard from "./dashboard/Dashboard"

export default function DashboardPage() {
    const { organization, role, ownerCount, memberCount } = useWorkspace()
    const fetchSummary = useMoodStore(state => state.fetchSummary)

    useEffect(() => {
        fetchSummary(organization._id)
    }, [organization._id, fetchSummary])

    if (role === "member") return <MemberDashboard organization={organization} />

    return <Dashboard
        userRole={role}
        organization={organization}
        ownerCount={ownerCount}
        memberCount={memberCount}
    />
}
