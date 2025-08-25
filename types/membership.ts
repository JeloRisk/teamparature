// types/membership.ts
export interface Member {
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
