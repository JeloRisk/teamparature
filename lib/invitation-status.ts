export const invitationStatuses = ["pending", "accepted", "expired", "cancelled"] as const
export function invitationExpiry(invite: { expiresAt?: Date | string; createdAt: Date | string }) {
    return new Date(invite.expiresAt ?? new Date(new Date(invite.createdAt).getTime() + 86400000))
}
export function invitationStatus(invite: { status: string; expiresAt?: Date | string; createdAt: Date | string }, now = Date.now()) {
    if (invite.status === "accepted" || invite.status === "cancelled") return invite.status
    return invite.status === "expired" || invitationExpiry(invite).getTime() <= now ? "expired" : "pending"
}
