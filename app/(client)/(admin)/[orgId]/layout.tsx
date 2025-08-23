import { ReactNode } from "react"
import { notFound } from "next/navigation"
import { Types } from "mongoose"
import connectDB from "@/lib/mongodb"
import { Organization } from "@/models/Organization"
import { Membership } from "@/models/Membership"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import User from "@/models/User"

import ClientDashboardLayout from "./ClientDashboardLayout"

interface OrgLayoutProps {
    children: ReactNode
    params: { orgId: string }
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const { orgId } = await params

    await connectDB()

    if (!Types.ObjectId.isValid(orgId)) return notFound()

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return notFound()

    const user = await User.findOne({ email: session.user.email })
    if (!user) return notFound()

    const membership = await Membership.findOne({
        user: user._id,
        organization: orgId,
    })
    if (!membership) return notFound()

    const organizationDoc = await Organization.findById(orgId).lean()
    if (!organizationDoc) return notFound()

    // 🔥 Convert Mongoose doc → plain object
    const organization = JSON.parse(JSON.stringify(organizationDoc))

    return (
        <ClientDashboardLayout organization={organization}>
            {children}
        </ClientDashboardLayout>
    )
}
