import { NextResponse } from "next/server";
import { Activity } from "@/models/Activity";
import mongoose, { Types } from "mongoose";
import { invitationStatuses } from "@/lib/invitation-status";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Invitation from "@/models/Invitation";
import { sendOrgInvitationEmail } from "@/lib/orgInvitationMailer";
import User from "@/models/User";
import { Organization } from "@/models/Organization";
import { Membership } from "@/models/Membership";
import { requirePermission } from "@/lib/rbac";

// You cannot type the second argument directly. Use URL pattern instead.
export async function POST(req: Request) {
    try {
        await connectDB();

        // Extract orgId from the URL
        const url = new URL(req.url);
        const orgId = url.pathname.split("/")[3]; // app/api/orgs/[orgId]/invite

        const { email, role } = await req.json();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const inviter = await User.findById(session.user.id);
        if (!inviter)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        const org = await Organization.findById(orgId);
        if (!org)
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });

        // Permission check
        const permissionCheck = await requirePermission(session.user.id, orgId, "invite_member");
        if (permissionCheck instanceof NextResponse) return permissionCheck;

        // Check existing user & membership
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const existingMembership = await Membership.findOne({
                user: existingUser._id,
                organization: orgId,
                isActive: true,
            });
            if (existingMembership) {
                return NextResponse.json(
                    { error: "User is already part of this organization" },
                    { status: 400 }
                );
            }
        }

        // Check pending invitation
        const existingInvitation = await Invitation.findOne({
            organization: orgId,
            email,
            status: "pending",
            $or: [
                { expiresAt: { $gt: new Date() } },
                { expiresAt: { $exists: false }, createdAt: { $gt: new Date(Date.now() - 86400000) } },
            ],
        });
        if (existingInvitation) {
            return NextResponse.json(
                { error: "An active invitation already exists for this user" },
                { status: 400 }
            );
        }

        // Create token & invitation
        const token = crypto.randomBytes(32).toString("hex");

        await Activity.init();
        const transaction = await mongoose.startSession();
        let reserved;
        try {
            reserved = await transaction.withTransaction(async () => {
                const workspace = await Organization.findOneAndUpdate({ _id: orgId }, { $inc: { __v: 1 } }, { session: transaction });
                if (!workspace) throw new Error("Workspace no longer exists");
                const owner = await Membership.exists({ organization: orgId, user: session.user.id, role: "owner", isActive: true }).session(transaction);
                if (!owner) throw new Error("Owner access required");
        const [invitation] = await Invitation.create([{
            organization: orgId,
            email,
            role: role || "member",
            invitedBy: inviter._id,
            token,
            status: "pending",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }], { session: transaction });

                const [activity] = await Activity.create([{
                    organization: orgId, actor: session.user.id, actorName: session.user.name || session.user.email || "Workspace owner",
                    action: "invitation_sent", targetId: invitation._id, targetLabel: email, outcome: "pending",
                }], { session: transaction });
                return { invitation, activity };
            });
        } finally {
            await transaction.endSession();
        }
        if (!reserved) throw new Error("Could not reserve invitation");
        const { invitation, activity } = reserved;

        try {
            await sendOrgInvitationEmail({
                inviterName: inviter.firstName || inviter.email,
                inviteeEmail: email,
                orgName: org.name,
                token,
            });
        } catch (error) {
            console.error("Invitation email delivery failed:", error);
            await Invitation.deleteOne({ _id: invitation._id, status: "pending" });
            await Activity.updateOne({ _id: activity._id }, { $set: { outcome: "failed" } });
            return NextResponse.json(
                { error: "Could not send the invitation email. Ask the workspace administrator to check the email configuration, then try again." },
                { status: 502 }
            );
        }

        await Activity.updateOne({ _id: activity._id }, { $set: { outcome: "succeeded" } });
        return NextResponse.json({ message: "Invitation sent", invitation });
    } catch (err: unknown) {
        console.error(err);

        return NextResponse.json({ error: "Could not create the invitation. Please try again." }, { status: 500 });
    }
}


export async function GET(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    const auth = await getServerSession(authOptions);
    if (!auth?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;
    if (!Types.ObjectId.isValid(orgId)) return NextResponse.json({ error: "Invalid workspace" }, { status: 400 });
    const query = new URL(req.url).searchParams;
    const page = Number(query.get("page") ?? 1);
    const status = query.get("status") ?? "all";
    const role = query.get("role") ?? "all";
    const search = (query.get("search") ?? "").trim().slice(0, 254);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        !["all", ...invitationStatuses].includes(status) || !["all", "owner", "member"].includes(role))
        return NextResponse.json({ error: "Invalid invitation filters" }, { status: 400 });
    try {
        await connectDB();
        const access = await requirePermission(auth.user.id, orgId, "invite_member");
        if (access !== true) return access;
        const filters: Record<string, unknown> = {};
        if (status !== "all") filters.effectiveStatus = status;
        if (role !== "all") filters.role = role;
        if (search) filters.email = { $regex: Array.from(search, char => "\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char).join(""), $options: "i" };
        const [result] = await Invitation.aggregate([
            { $match: { organization: new Types.ObjectId(orgId) } },
            { $addFields: { expiresAt: { $ifNull: ["$expiresAt", { $add: ["$createdAt", 86400000] }] } } },
            { $addFields: { effectiveStatus: { $cond: [
                { $in: ["$status", ["accepted", "cancelled"]] }, "$status",
                { $cond: [{ $or: [{ $eq: ["$status", "expired"] }, { $lte: ["$expiresAt", new Date()] }] }, "expired", "pending"] },
            ] } } },
            { $facet: {
                totals: [{ $count: "count" }],
                pending: [{ $match: { effectiveStatus: "pending" } }, { $count: "count" }],
                filteredCount: [{ $match: filters }, { $count: "count" }],
                rows: [
                    { $match: filters },
                    { $sort: { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * 10 }, { $limit: 10 },
                    { $project: { _id: 1, email: 1, role: 1, status: "$effectiveStatus", createdAt: 1, expiresAt: 1, lastSentAt: 1 } },
                ],
            } },
        ]);
        return NextResponse.json({
            invitations: result.rows,
            total: result.filteredCount[0]?.count ?? 0,
            totalAll: result.totals[0]?.count ?? 0,
            pending: result.pending[0]?.count ?? 0,
            page, pageSize: 10,
        });
    } catch (error) {
        console.error("Invitation listing failed", error);
        return NextResponse.json({ error: "Could not load invitations" }, { status: 500 });
    }
}
