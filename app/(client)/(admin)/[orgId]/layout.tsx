import { ReactNode } from "react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Types } from "mongoose"
import { Organization } from "@/models/Organization"
import { Membership } from "@/models/Membership"

import { getWorkspaceMembership } from "./workspace-access"
import ClientDashboardLayout from "./ClientDashboardLayout"

interface OrgLayoutProps {
    children: ReactNode
    params: Promise<{ orgId: string }>
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const { orgId } = await params
    const cookieStore = await cookies()
    const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

    const membership = await getWorkspaceMembership(orgId)
    if (!membership) return notFound()

    const organizationDoc = await Organization.findById(orgId).select("name slug").lean<{ name: string; slug: string }>()
    if (!organizationDoc) return notFound()

    const memberCounts = membership.role === "owner"
        ? await Membership.aggregate<{ _id: string; count: number }>([
            { $match: { organization: new Types.ObjectId(orgId), isActive: true } },
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ])
        : []
    const workspace = {
        organization: { _id: orgId, name: organizationDoc.name, slug: organizationDoc.slug },
        role: membership.role,
        ownerCount: memberCounts.find(row => row._id === "owner")?.count ?? 0,
        memberCount: memberCounts.find(row => row._id === "member")?.count ?? 0,
    }

    return (
        <ClientDashboardLayout workspace={workspace} sidebarDefaultOpen={sidebarDefaultOpen}>
            {children}
        </ClientDashboardLayout>
    )
}
