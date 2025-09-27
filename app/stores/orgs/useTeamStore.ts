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
    memberships: Member[]
    loading: boolean
    error: string | null

    fetchOrganizationDetails: (orgId: string, force?: boolean) => Promise<Organization | null>
    clearOrganization: () => void
}

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err)
}

export const useOrgStore = create<OrgState>((set, get) => ({
    organization: null,
    membership: null,
    memberships: [],
    loading: false,
    error: null,

    fetchOrganizationDetails: async (orgId: string, force = false) => {
        const { organization, loading } = get()

        // Avoid refetch if data is already loaded and not forced
        if (organization?._id === orgId && !force) {
            return organization
        }

        // Avoid multiple concurrent fetches
        if (loading) return null

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
        } catch (err: unknown) {
            set({ error: getErrorMessage(err), loading: false })
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
