import { ReactNode } from "react"
import { notFound } from "next/navigation"
import { Types } from "mongoose"
import connectDB from "@/lib/mongodb"
import { Organization } from "@/models/Organization"
import { Membership } from "@/models/Membership"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import ClientDashboardLayout from "./ClientDashboardLayout"

interface OrgLayoutProps {
    children: ReactNode
    params: { orgId: string }
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const { orgId } = await params

    if (!Types.ObjectId.isValid(orgId)) return notFound()

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return notFound()
    await connectDB()

    const membership = await Membership.findOne({
        user: session.user.id,
        organization: orgId,
        isActive: true,
    })
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
        <ClientDashboardLayout workspace={workspace}>
            {children}
        </ClientDashboardLayout>
    )
}
