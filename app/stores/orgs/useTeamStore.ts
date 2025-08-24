import { create } from "zustand"

interface Member {
    _id: string
    user: {
        _id: string
        firstName: string
        lastName: string

        email: string
        image?: string
    }
    role: string
}

interface Organization {
    _id: string
    name: string
    description?: string
    slug: string
}

interface Membership {
    role: string
    isCreator: boolean
}

interface OrgState {
    organization: Organization | null
    membership: Membership | null
    memberships: Member[] // 👈 all members
    loading: boolean
    error: string | null

    fetchOrganizationDetails: (orgId: string) => Promise<Organization | null>
    clearOrganization: () => void
}

export const useOrgStore = create<OrgState>((set) => ({
    organization: null,
    membership: null,
    memberships: [],
    loading: false,
    error: null,

    fetchOrganizationDetails: async (orgId: string) => {
        set({ loading: true, error: null })
        try {
            const res = await fetch(`/api/orgs/${orgId}`)
            if (!res.ok) throw new Error(`Failed to fetch organization`)
            const data = await res.json()

            set({
                organization: data.organization,
                membership: data.membership,
                memberships: data.memberships || [],
                loading: false,
            })

            return data.organization
        } catch (err: any) {
            set({ error: err.message, loading: false })
            return null
        }
    },

    clearOrganization: () =>
        set({
            organization: null,
            membership: null,
            memberships: [],
            loading: false,
            error: null,
        }),
}))
