// app/api/orgs/[orgId]/route.ts
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Invitation from "@/models/Invitation"
import { Organization } from "@/models/Organization"
import { Membership } from "@/models/Membership"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
    req: Request,
    context: { params: Promise<{ orgId: string }> } 
) {
    try {
        await connectDB()

        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({
 error: "Unauthorized" }, { status: 401 })
        }

        // Get orgId from awaited params
        const { orgId } = await context.params

        // Check membership
        const membership = await Membership.findOne({
            user: session.user.id,
            isActive: true,
            organization: orgId,
        })

        if (!membership) {
            return NextResponse.json(
                { error: "Forbidden: Not a member of this organization" },
                { status: 403 }
            )
        }

        const organization = await Organization.findById(orgId).lean()
        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // ✅ Fetch all members of the org
        const memberships = membership.role === "owner" ? await Membership.find({ organization: orgId, isActive: true })
            .populate("user", "firstName lastName name email image") // include more fields
            .lean() : []

        const invitations = membership.role === "owner" ? await Invitation.find({
            organization: orgId,
        }).select("_id email role status createdAt expiresAt").sort({ createdAt: -1 }).lean() : []

        return NextResponse.json({
            invitations,
            organization,
            membership: {
                role: membership.role,
                isCreator: membership.isCreator || false,
            },
            memberships, // 👈 return all members here
        })
    } catch (error) {
        console.error("GET /api/orgs/[orgId] error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
