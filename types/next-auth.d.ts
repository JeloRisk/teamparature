// types/next-auth.d.ts (or any global.d.ts file)

import NextAuth from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name?: string
            firstName?: string
            lastName?: string
            avatar?: string
            birthday?: string
            onboarded: boolean;

        }
    }

    interface User {
        id: string
        onboarded: boolean;

    }

    interface JWT {
        id?: string
        onboarded: boolean;

    }
}
