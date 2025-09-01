// app/api/orgs/[orgId]/route.ts
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Organization } from "@/models/Organization"
import { Membership } from "@/models/Membership"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import User from "@/models/User"

export async function GET(
    req: Request,
    context: { params: Promise<{ orgId: string }> } 
) {
    try {
        await connectDB()

        const session = await getServerSession(authOptions)
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get orgId from awaited params
        const { orgId } = await context.params

        // Get logged-in user
        const user = await User.findOne({ email: session.user.email })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check membership
        const membership = await Membership.findOne({
            user: user._id,
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
        const memberships = await Membership.find({ organization: orgId })
            .populate("user", "firstName lastName name email image") // include more fields
            .lean()

        return NextResponse.json({
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
