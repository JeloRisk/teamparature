import { create } from "zustand"

interface Membership {
    organization: string
    role: "owner" | "member"
}

interface RBACState {
    memberships: Membership[]
    setMemberships: (memberships: Membership[]) => void
    getRole: (orgId: string) => "owner" | "member" | null
}

export const useRBACStore = create<RBACState>((set, get) => ({
    memberships: [],
    setMemberships: (memberships) => set({ memberships }),
    getRole: (orgId: string) => {
        const membership = get().memberships.find((m) => m.organization === orgId)
        return membership?.role ?? null
    },
}))
