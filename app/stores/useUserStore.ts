
import { create } from 'zustand';

type User = {
    _id: string;
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    birthday?: string;
    isVerified?: boolean; // added
};

type State = {
    user: User | null;
    hasValidToken: boolean | null;
    loading: boolean;
    error: string | null;
    setUser: (user: User) => void;
    clearUser: () => void;
    fetchUser: (id: string) => Promise<void>;
    updateUser: (user: Partial<User>) => Promise<void>;
    fetchVerificationStatus: () => Promise<void>;
    resendVerification: () => Promise<void>;
};

export const useUserStore = create<State>((set, get) => ({
    user: null,
    hasValidToken: null,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),

    clearUser: () => set({ user: null }),

    fetchUser: async (id: string) => {
        const res = await fetch(`/api/users/${id}`, {
            method: 'POST',
        });

        const data = await res.json();
        set({ user: data });
    },

    updateUser: async (userData) => {
        const currentUser = get().user;
        if (!currentUser?._id) {
            console.error("No user ID for update");
            return;
        }

        try {
            const res = await fetch(`/api/users/${currentUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (res.status === 405) {
                window.location.href = '/405';
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'Something went wrong');
                return;
            }

            const updatedUser = await res.json();
            set({ user: updatedUser });

        } catch (err) {
            console.error('Update failed:', err);
            alert('An unexpected error occurred.');
        }
    },

    fetchVerificationStatus: async () => {
        set({ loading: true, error: null });
        try {
            const res = await fetch('/api/user');
            if (!res.ok) throw new Error('Failed to fetch verification status');

            const data = await res.json();
            console.log('Verification status:', data);
            set({
                user: { ...(get().user || {}), ...data }, // merge with existing user info
                hasValidToken: data.hasValidToken ?? null,
                loading: false
            });

        } catch (err: any) {
            set({ error: err.message || 'Failed to load verification status', loading: false });
        }
    },

    resendVerification: async () => {
        const currentUser = get().user;
        if (!currentUser?._id) {
            console.error("No user ID for resend");
            return;
        }

        set({ loading: true, error: null });
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to resend verification email');

            alert(data.message || 'Verification email sent.');
            await get().fetchVerificationStatus(); // refresh status
        } catch (err: any) {
            set({ error: err.message || 'Failed to resend verification email' });
        } finally {
            set({ loading: false });
        }
    },
}));
