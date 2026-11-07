import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Invitation from "@/models/Invitation"
import { Membership } from "@/models/Membership"
import { Organization } from "@/models/Organization"

export async function POST(req: Request) {
    const auth = await getServerSession(authOptions)
    if (!auth?.user?.id || !auth.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { token } = await req.json()
    if (typeof token !== "string" || !token) return NextResponse.json({ error: "Invalid invitation" }, { status: 400 })
    await connectDB()
    const initial = await Invitation.findOne({ token }).select("organization")
    if (!initial) return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    const session = await mongoose.startSession()
    try {
        const result = await session.withTransaction(async () => {
            const org = await Organization.findOneAndUpdate({ _id: initial.organization }, { $inc: { __v: 1 } }, { session })
            if (!org) return { error: "Workspace not found", status: 404 }
            const invitation = await Invitation.findOne({ token }).session(session)
            if (!invitation) return { error: "Invitation not found", status: 404 }
            if (invitation.email.toLowerCase() !== auth.user.email?.toLowerCase())
                return { error: "Sign in with the invited email address", status: 403 }
            if (invitation.status === "accepted") return { status: 200 }
            if (invitation.status === "cancelled") return { error: "Invitation cancelled", status: 410 }
            const expires = invitation.expiresAt ?? new Date(invitation.createdAt.getTime() + 86400000)
            if (invitation.status === "expired" || expires <= new Date()) return { error: "Invitation expired", status: 410 }
            const existing = await Membership.findOne({ user: auth.user.id, organization: invitation.organization }).session(session)
            if (!existing) {
                await Membership.create([{
                    user: auth.user.id, organization: invitation.organization, role: invitation.role, isActive: true,
                }], { session })
            } else if (!existing.isActive) {
                existing.isActive = true
                existing.role = invitation.role
                await existing.save({ session })
            }
            invitation.status = "accepted"
            await invitation.save({ session })
            return { status: 200 }
        })
        return NextResponse.json(result?.error ? { error: result.error } : { message: "Invitation accepted" }, { status: result?.status ?? 500 })
    } catch (error) {
        console.error("Invitation acceptance failed", error)
        return NextResponse.json({ error: "Could not accept the invitation. Please try again." }, { status: 500 })
    } finally {
        await session.endSession()
    }
}
