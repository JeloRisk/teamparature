"use client"

import { useEffect } from "react"
import { useMoodStore } from "@/app/stores/useMoodStore"
import { useWorkspace } from "../ClientDashboardLayout"
import Dashboard from "./Dashboard"

export default function DashboardPage() {
    const { organization, role, ownerCount, memberCount } = useWorkspace()
    const fetchSummary = useMoodStore(state => state.fetchSummary)

    useEffect(() => {
        fetchSummary(organization._id)
    }, [organization._id, fetchSummary])

    return <Dashboard
        userRole={role}
        organization={organization}
        ownerCount={ownerCount}
        memberCount={memberCount}
    />
}
