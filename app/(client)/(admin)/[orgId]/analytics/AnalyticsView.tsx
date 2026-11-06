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
    return <MoodAnalytics orgId={organization._id} />
}
