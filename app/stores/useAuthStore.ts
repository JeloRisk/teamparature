import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
    user: { id: string; email: string; firstName?: string; lastName?: string } | null;
    token: string | null;
    setUser: (user: AuthState["user"]) => void;
    setToken: (token: string | null) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            logout: async () => {
                try {
                    await fetch("/api/auth/logout", { method: "POST" });

                    set({ user: null, token: null });
                    localStorage.removeItem("zustand");
                } catch (err) {
                    console.error("Logout failed", err);
                }
            },
        }),
        {
            name: "auth-storage", // key in localStorage
        }
    )
);
