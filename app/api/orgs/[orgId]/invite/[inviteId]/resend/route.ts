import { NextResponse } from "next/server"
import mongoose, { Types } from "mongoose"
import { randomBytes } from "node:crypto"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Invitation from "@/models/Invitation"
import { Organization } from "@/models/Organization"
import { Membership } from "@/models/Membership"
import User from "@/models/User"
import { sendOrgInvitationEmail } from "@/lib/orgInvitationMailer"

class ResendError extends Error {
    constructor(message: string, public status: number) { super(message) }
}

export async function POST(_req: Request, { params }: { params: Promise<{ orgId: string; inviteId: string }> }) {
    const auth = await getServerSession(authOptions)
    if (!auth?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { orgId, inviteId } = await params
    if (![orgId, inviteId].every(id => Types.ObjectId.isValid(id))) return NextResponse.json({ error: "Invalid invitation" }, { status: 400 })
    const token = randomBytes(32).toString("hex")
    try {
        await connectDB()
        const session = await mongoose.startSession()
        let reservation
        try {
            reservation = await session.withTransaction(async () => {
                const workspace = await Organization.findOneAndUpdate({ _id: orgId }, { $inc: { __v: 1 } }, { session })
                if (!workspace) throw new ResendError("Workspace not found", 404)
                const actor = await Membership.findOne({ organization: orgId, user: auth.user.id, role: "owner", isActive: true }).session(session)
                if (!actor) throw new ResendError("Owner access required", 403)
                const invitation = await Invitation.collection.findOne({ _id: new Types.ObjectId(inviteId), organization: new Types.ObjectId(orgId) }, { session })
                if (!invitation) throw new ResendError("Invitation not found", 404)
                if (!["pending", "expired"].includes(invitation.status)) throw new ResendError("Only pending or expired invitations can be resent", 409)
                const lastSent = invitation.lastSentAt ?? invitation.createdAt
                if (new Date(lastSent).getTime() > Date.now() - 60000) throw new ResendError("Please wait one minute before resending", 429)
                const recipient = await User.findOne({ email: { $eq: invitation.email } }).select("_id").session(session)
                if (recipient && await Membership.exists({ organization: orgId, user: recipient._id, isActive: true }).session(session))
                    throw new ResendError("This person is already a workspace member", 409)
                const now = new Date()
                await Invitation.collection.updateOne({ _id: invitation._id }, { $set: {
                    token, status: "pending", lastSentAt: now, expiresAt: new Date(now.getTime() + 86400000),
                } }, { session })
                return { invitation, name: workspace.name }
            })
        } finally {
            await session.endSession()
        }
        if (!reservation) throw new Error("Could not reserve invitation")
        try {
            await sendOrgInvitationEmail({
                inviterName: auth.user.name ?? "Workspace owner",
                inviteeEmail: reservation.invitation.email,
                orgName: reservation.name,
                token,
            })
        } catch (error) {
            const old = reservation.invitation
            // Preserve a cancellation or acceptance that occurred while delivery was in flight.
            await Invitation.collection.updateOne({ _id: old._id, token, status: "pending" }, { $set: {
                token: old.token, status: old.status,
                expiresAt: old.expiresAt ?? new Date(new Date(old.createdAt).getTime() + 86400000),
                lastSentAt: old.lastSentAt ?? old.createdAt,
            } })
            console.error("Invitation resend delivery failed", error)
            return NextResponse.json({ error: "Email delivery failed. Check the mail configuration and try again." }, { status: 502 })
        }
        return NextResponse.json({ message: "Invitation resent. The new link expires in 24 hours." })
    } catch (error) {
        if (error instanceof ResendError) return NextResponse.json({ error: error.message }, { status: error.status })
        console.error("Invitation resend failed", error)
        return NextResponse.json({ error: "Could not resend invitation" }, { status: 500 })
    }
}
