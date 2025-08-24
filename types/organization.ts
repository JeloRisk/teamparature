// types/organization.ts
export interface Organization {
    _id: string
    name: string
    logoUrl?: string
    // other fields...

    memberships?: {
        user: {
            _id: string
            name: string
            email: string
            image?: string
        }
        role: string
    }[]
}
