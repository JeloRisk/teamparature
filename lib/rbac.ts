// lib/rbac.ts
export type Role = "owner" | "member"; // only these two

export const rolePermissions: Record<Role, string[]> = {
    owner: [
        "invite_member",
        "delete_member",
        "update_org",
        "view_analytics",
        "view_members",
    ],
    member: [
        "check_mood",
    ],
};

/**
 * Checks if a role has a specific permission
 * @param role Role of the user
 * @param permission Permission to check
 * @returns boolean
 */
export function hasPermission(role: Role, permission: string): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
}
