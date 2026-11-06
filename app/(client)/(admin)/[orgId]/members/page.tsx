import { notFound } from "next/navigation"
import { getWorkspaceMembership } from "../workspace-access"
import MembersView from "./MembersView"

export default async function MembersPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params
    const membership = await getWorkspaceMembership(orgId)
    if (membership?.role !== "owner") notFound()
    return <MembersView />
}
