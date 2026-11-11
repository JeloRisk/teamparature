"use client"

import { useEffect } from "react"
import { notFound } from "next/navigation"
import { useMoodAnalyticsStore } from "@/app/stores/useMoodAnalyticsStore"
import { useWorkspace } from "../ClientDashboardLayout"
import MoodAnalytics from "./MoodAnalytics"

export default function AnalyticsPage() {
    const { organization, role } = useWorkspace()
    const fetchAnalytics = useMoodAnalyticsStore(state => state.fetchAnalytics)

    useEffect(() => {
        if (role === "owner") fetchAnalytics(organization._id)
    }, [organization._id, role, fetchAnalytics])

    if (role !== "owner") notFound()
    return (
        <div className="dashboard-reference-theme -m-4 min-w-0 flex-1 bg-background px-4 py-5 sm:py-8 md:-mx-10 md:px-10">
            <div className="mx-auto w-full min-w-0 max-w-7xl">
                <MoodAnalytics orgId={organization._id} />
            </div>
        </div>
    )
}
