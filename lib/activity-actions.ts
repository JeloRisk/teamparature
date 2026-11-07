export const activityActions = {
    member_removed: "Removed member",
    member_restored: "Restored member",
    role_changed: "Changed role",
    invitation_sent: "Sent invitation",
    invitation_resent: "Resent invitation",
    invitation_cancelled: "Cancelled invitation",
    workspace_updated: "Updated workspace settings",
} as const

export type ActivityAction = keyof typeof activityActions
