import { notFound } from "next/navigation"
import { getWorkspaceMembership } from "../workspace-access"
import { getWorkspaceTimezone } from "@/lib/workspace-time"
import ActivityView from "./ActivityView"

export default async function ActivityPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params
    const membership = await getWorkspaceMembership(orgId)
    if (membership?.role !== "owner") notFound()
    const timezone = await getWorkspaceTimezone(orgId)
    return <ActivityView orgId={orgId} timezone={timezone} />
}
