import { Membership } from "@/models/Membership";
import { NextResponse } from "next/server";

export type Role = "owner" | "admin" | "member";

export const rolePermissions: Record<Role, string[]> = {
    owner: ["invite_member", "delete_member", "update_org"],
    admin: ["invite_member", "update_org"],
    member: [],
};


export async function requirePermission(
    userId: string,
    orgId: string,
    permission: string
) {
    const membership = await Membership.findOne({ user: userId, organization: orgId, isActive: true });

    if (!membership) {
        return NextResponse.json({ error: "Forbidden: not a member" }, { status: 403 });
    }

    const perms = rolePermissions[membership.role as Role] || [];
    if (!perms.includes(permission)) {
        return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
    }

    return membership;
}
