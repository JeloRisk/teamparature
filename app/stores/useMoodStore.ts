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
    moods: Mood[];
    ownerMoods: Mood[];
    loadingMood: boolean;
    fetchAllMoods: (orgId: string) => Promise<void>;
    addMood: (data: {
        orgId: string;
        userId: string;
        mood: Mood["mood"];
        rank: number;
        note?: string;
    }) => Promise<void>;
    hasTrackedToday: () => boolean;
    moodCountToday: (userId: string) => number;
}

export const useMoodStore = create<MoodState>((set, get) => ({
    moods: [],
    ownerMoods: [],
    loadingMood: false,

    // ✅ Fetch both in one go
    fetchAllMoods: async (orgId) => {
        set({ loadingMood: true });
        try {
            const [moodsRes, ownerRes] = await Promise.all([
                fetch(`/api/orgs/${orgId}/moods`),
                fetch(`/api/orgs/${orgId}/moods/owner`),
            ]);

            const [moods, ownerMoods] = await Promise.all([
                moodsRes.json(),
                ownerRes.json(),
            ]);

            set({ moods, ownerMoods });
        } catch (err) {
            console.error("Failed to fetch moods:", err);
        } finally {
            set({ loadingMood: false });
        }
    },

    // Add mood
    addMood: async (data) => {
        const tempMood: Mood = {
            _id: crypto.randomUUID(),
            ...data,
            date: new Date().toISOString(),
            organization: data.orgId,
            user: data.userId,
        };

        set((state) => ({
            moods: [...state.moods, tempMood],
            ownerMoods: [...state.ownerMoods, tempMood],
        }));

        try {
            const res = await fetch(`/api/orgs/${data.orgId}/moods/owner`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const savedMood: Mood = await res.json();

            // Replace temp with saved
            set((state) => ({
                moods: state.moods.map((m) => (m._id === tempMood._id ? savedMood : m)),
                ownerMoods: state.ownerMoods.map((m) => (m._id === tempMood._id ? savedMood : m)),
            }));
        } catch (err) {
            console.error("Failed to save mood:", err);

            // Rollback temp if failed
            set((state) => ({
                moods: state.moods.filter((m) => m._id !== tempMood._id),
                ownerMoods: state.ownerMoods.filter((m) => m._id !== tempMood._id),
            }));
        }
    },


    // ✅ Has owner tracked today?
    hasTrackedToday: () => {
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();

        return get().ownerMoods.some((m) => {
            if (!m.date) return false;

            const parsed = new Date(m.date);
            if (isNaN(parsed.getTime())) return false;

            return (
                parsed.getFullYear() === todayYear &&
                parsed.getMonth() === todayMonth &&
                parsed.getDate() === todayDate
            );
        });
    },


    // ✅ Count member moods today
    moodCountToday: (userId) => {
        const today = new Date().toDateString();
        return get().moods.filter(
            (m) => m.user === userId && new Date(m.date).toDateString() === today
        ).length;
    },
}));
