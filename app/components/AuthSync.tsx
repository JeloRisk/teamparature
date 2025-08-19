'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useUserStore } from '../stores/useUserStore'

export default function AuthSync() {
    const { data: session, status } = useSession()
    const fetchUser = useUserStore((state) => state.fetchUser)
    const clearUser = useUserStore((state) => state.clearUser)

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            fetchUser(session.user.id)
        } else if (status === 'unauthenticated') {
            clearUser()
        }
    }, [status, session?.user?.id, fetchUser, clearUser])

    return null
}