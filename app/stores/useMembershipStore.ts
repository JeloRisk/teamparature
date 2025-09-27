"use client"

import { create } from "zustand"

interface Organization {
    _id: string
    name: string
    plan: string
    logoUrl?: string
    slug: string
    memberships?: { role: string }[]
}

interface Membership {
    _id: string
    organization: Organization
    role: string
    isCreator?: boolean
}

interface MembershipState {
    memberships: Membership[]
    activeMembership: Membership | null
    organization: Organization | null
    loading: boolean
    error: string | null
    fetchMemberships: () => Promise<void>
    setActiveMembership: (membership: Membership) => void
    fetchOrganizationDetails: (orgId: string) => Promise<Organization | null>
}function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}


export const useMembershipStore = create<MembershipState>((set) => ({
    memberships: [],
    activeMembership: null,
    organization: null,
    loading: false,
    error: null,


    fetchMemberships: async () => {
        set((state) => {
            if (state.memberships.length > 0) {
                return state // ✅ Already loaded, skip re-fetch
            }
            return { ...state, loading: true, error: null }
        })

        try {
            const res = await fetch("/api/me/memberships")
            if (!res.ok) throw new Error("Failed to fetch memberships")
            const data = await res.json()
            set({
                memberships: data.memberships || [],
                activeMembership: data.memberships?.[0] || null,
                loading: false,
            })
        } catch (err: unknown) {
            console.error("Membership fetch error:", err)
            set({ loading: false, error: getErrorMessage(err) })
        }
    },

    fetchOrganizationDetails: async (orgId: string) => {
        set({ loading: true, error: null })
        try {
            const res = await fetch(`/api/orgs/${orgId}`)
            if (res.status === 403 || res.status === 404) {
                set({ organization: null, loading: false })
                return null
            }
            if (!res.ok) throw new Error("Failed to fetch organization details")

            const data = await res.json()
            set({ organization: data.organization, loading: false })
            return data.organization
        } catch (err: unknown) {
            console.error("Organization fetch error:", err)
            set({ loading: false, error: getErrorMessage(err) })
            return null
        }
    },

    setActiveMembership: (membership) => set({ activeMembership: membership }),





}))
