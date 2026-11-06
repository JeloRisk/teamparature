import { notFound } from "next/navigation"
import { getWorkspaceMembership } from "../workspace-access"
import AnalyticsView from "./AnalyticsView"

export default async function AnalyticsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params
    const membership = await getWorkspaceMembership(orgId)
    if (membership?.role !== "owner") notFound()
    return <AnalyticsView />
}
