import { cache } from "react"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { Membership } from "@/models/Membership"

export const getWorkspaceMembership = cache(async (orgId: string) => {
    if (!Types.ObjectId.isValid(orgId)) return null
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null
    await connectDB()
    return Membership.findOne({
        user: session.user.id,
        organization: orgId,
        isActive: true,
    }).select("role")
})
