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
    isVerified?: boolean;
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

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

export const useUserStore = create<State>((set, get) => ({
    user: null,
    hasValidToken: null,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),

    clearUser: () => set({ user: null }),

    fetchUser: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'POST' }); // should be GET, not POST
            if (!res.ok) throw new Error('Failed to fetch user');
            const data = await res.json();
            set({ user: data, loading: false });
        } catch (err) {
            set({ error: getErrorMessage(err), loading: false });
        }
    },

    updateUser: async (userData) => {
        const currentUser = get().user;
        if (!currentUser?._id) {
            set({ error: 'No user ID for update' });
            return;
        }

        set({ loading: true, error: null });
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

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Update failed');

            set({ user: data, loading: false });
        } catch (err) {
            set({ error: getErrorMessage(err), loading: false });
        }
    },

    fetchVerificationStatus: async () => {
        set({ loading: true, error: null });
        try {
            const res = await fetch('/api/user');
            if (!res.ok) throw new Error('Failed to fetch verification status');

            const data = await res.json();
            set({
                user: { ...(get().user || {}), ...data },
                hasValidToken: data.hasValidToken ?? null,
                loading: false,
            });
        } catch (err) {
            set({ error: getErrorMessage(err), loading: false });
        }
    },

    resendVerification: async () => {
        const currentUser = get().user;
        if (!currentUser?._id) {
            set({ error: 'No user ID for resend' });
            return;
        }

        set({ loading: true, error: null });
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to resend verification email');

            alert(data.message || 'Verification email sent.');
            await get().fetchVerificationStatus();
        } catch (err) {
            set({ error: getErrorMessage(err) });
        } finally {
            set({ loading: false });
        }
    },
}));
