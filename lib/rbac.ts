// lib/rbac.ts
import { NextResponse } from "next/server";

export type Role = "owner" | "member";

export const rolePermissions: Record<Role, string[]> = {
    owner: [
        "invite_member",
        "delete_member",
        "update_org",
        "view_analytics",
        "view_members",
    ],
    member: ["check_mood"],
};

export function hasPermission(role: Role, permission: string): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Require a permission for a user in an org.
 * Returns `true` if allowed, or a `NextResponse` if denied.
 */
export async function requirePermission(
    userId: string,
    orgId: string,
    permission: string
): Promise<true | NextResponse> {
    // Replace this with your actual membership lookup
    const { Membership } = await import("@/models/Membership");
    const membership = await Membership.findOne({
        user: userId,
        organization: orgId,
        isActive: true,
    });

    if (!membership) {
        return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const role: Role = membership.role as Role;
    if (!hasPermission(role, permission)) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return true;
}
