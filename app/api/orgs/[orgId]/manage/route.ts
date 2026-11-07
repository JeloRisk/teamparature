import { NextResponse } from "next/server"
import mongoose, { Types } from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { Organization } from "@/models/Organization"
import { Membership } from "@/models/Membership"
import { Team } from "@/models/Team"
import { Mood } from "@/models/Mood"
import Invitation from "@/models/Invitation"

class ManagementError extends Error {
    constructor(message: string, public status: number) { super(message) }
}

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    const auth = await getServerSession(authOptions)
    if (!auth?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { orgId } = await params
    if (!Types.ObjectId.isValid(orgId)) return NextResponse.json({ error: "Invalid workspace" }, { status: 400 })

    try {
        const body = await req.json()
        const actions = ["remove_member", "change_role", "cancel_invitation", "delete_workspace"]
        if (!actions.includes(body.action)) throw new ManagementError("Invalid action", 400)
        if (body.action !== "delete_workspace" && (typeof body.id !== "string" || !Types.ObjectId.isValid(body.id)))
            throw new ManagementError("Invalid record", 400)
        if (body.action === "change_role" && !["owner", "member"].includes(body.role))
            throw new ManagementError("Invalid role", 400)

        await connectDB()
        const session = await mongoose.startSession()
        try {
            await session.withTransaction(async () => {
                // Serialize workspace administration so concurrent owner changes cannot remove the last owner.
                const organization = await Organization.findOneAndUpdate({ _id: orgId }, { $inc: { __v: 1 } }, { session })
                if (!organization) throw new ManagementError("Workspace not found", 404)
                const actor = await Membership.findOne({ organization: orgId, user: auth.user.id, isActive: true }).session(session)
                if (actor?.role !== "owner") throw new ManagementError("Owner access required", 403)

                if (body.action === "delete_workspace") {
                    if (body.name !== organization.name) throw new ManagementError("Enter the workspace name exactly to confirm", 400)
                    await Mood.deleteMany({ organization: orgId }, { session })
                    await Invitation.deleteMany({ organization: orgId }, { session })
                    await Membership.deleteMany({ organization: orgId }, { session })
                    await Team.deleteMany({ organization: orgId }, { session })
                    await Organization.deleteOne({ _id: orgId }, { session })
                    return
                }

                if (body.action === "cancel_invitation") {
                    const invitation = await Invitation.findOne({ _id: body.id, organization: orgId }).session(session)
                    if (!invitation) throw new ManagementError("Invitation not found", 404)
                    if (invitation.status === "cancelled") return
                    const expiry = invitation.expiresAt ?? new Date(invitation.createdAt.getTime() + 86400000)
                    if (invitation.status !== "pending" || expiry <= new Date())
                        throw new ManagementError("Only pending invitations can be cancelled", 409)
                    // Use a guarded update so development servers with a cached older
                    // Mongoose enum can still revoke links after this status is introduced.
                    const result = await Invitation.updateOne(
                        { _id: invitation._id, organization: orgId, status: "pending" },
                        { $set: { status: "cancelled" } },
                        { session }
                    )
                    if (result.modifiedCount !== 1)
                        throw new ManagementError("This invitation has changed. Refresh and try again.", 409)
                    return
                }

                const target = await Membership.findOne({ _id: body.id, organization: orgId, isActive: true }).session(session)
                if (!target) throw new ManagementError("Active member not found", 404)
                if (target.role === "owner" && (body.action === "remove_member" || body.role === "member")) {
                    const owners = await Membership.countDocuments({ organization: orgId, role: "owner", isActive: true }).session(session)
                    if (owners <= 1) throw new ManagementError("Add another owner before removing or demoting the last owner", 409)
                }
                if (body.action === "remove_member") target.isActive = false
                else target.role = body.role
                await target.save({ session })
            })
        } finally {
            await session.endSession()
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof ManagementError)
            return NextResponse.json({ error: error.message }, { status: error.status })
        console.error("Workspace management failed", error)
        return NextResponse.json({ error: "Could not update the workspace. Please try again." }, { status: 500 })
    }
}
