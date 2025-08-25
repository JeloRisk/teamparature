import { create } from "zustand";

export interface Mood {
    _id: string;
    mood: "happy" | "neutral" | "sad" | "stressed" | "excited";
    rank: number;
    note?: string;
    date: string;
    user: string;
    organization: string;
}

interface MoodState {
    moods: Mood[];          // member moods
    ownerMoods: Mood[];     // owner moods
    loading: boolean;
    fetchMoods: (orgId: string) => Promise<void>;
    fetchOwnerMoods: (orgId: string) => Promise<void>;
    addMood: (data: {
        orgId: string;
        userId: string;
        mood: Mood["mood"];
        rank: number;
        note?: string;
        userName: string;
        userEmail: string;
    }) => Promise<void>;
    hasTrackedToday: () => boolean; // owner
    moodCountToday: (userId: string) => number; // member
}

export const useMoodStore = create<MoodState>((set, get) => ({
    moods: [],
    ownerMoods: [],
    loading: false,

    // fetch member moods
    fetchMoods: async (orgId) => {
        set({ loading: true });
        try {
            const res = await fetch(`/api/orgs/${orgId}/moods`);
            const data = await res.json();
            set({ moods: data });
        } catch (err) {
            console.error(err);
        } finally {
            set({ loading: false });
        }
    },

    // fetch owner moods
    fetchOwnerMoods: async (orgId) => {
        set({ loading: true });
        try {
            const res = await fetch(`/api/orgs/${orgId}/moods/owner`);
            const data = await res.json();
            set({ ownerMoods: data });
        } catch (err) {
            console.error(err);
        } finally {
            set({ loading: false });
        }
    },

    // add a new mood (member)
    addMood: async (data) => {
        try {
            const res = await fetch("/api/moods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const newMood = await res.json();
            set((state) => ({ moods: [...state.moods, newMood] }));
        } catch (err) {
            console.error(err);
        }
    },

    // check if owner has tracked today
    hasTrackedToday: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().moods.some((m) => {
            const moodDate = new Date(m.date).toISOString().slice(0, 10);
            console.log("Checking:", today, moodDate);
            return moodDate === today;
        });
    },


    // count moods for a member today
    moodCountToday: (userId) => {
        const today = new Date().toDateString();
        return get().moods.filter(
            (m) => m.user === userId && new Date(m.date).toDateString() === today
        ).length;
    },
}));
