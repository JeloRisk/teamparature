import { create } from "zustand"

type Mood = "happy" | "neutral" | "sad" | "stressed" | "excited"
type Trend = Record<Mood, number> & { day: string }

interface Summary {
    checkedInToday: boolean
    trend?: Trend[]
    participantsToday?: number
}

interface MoodState {
    summary: Summary | null
    orgId: string | null
    error: string | null
    fetchSummary: (orgId: string) => Promise<void>
    addMood: (data: { orgId: string; mood: Mood; rank: number; note: string }) => Promise<void>
}

export const useMoodStore = create<MoodState>((set, get) => ({
    summary: null,
    orgId: null,
    error: null,

    fetchSummary: async (orgId) => {
        set((state) => ({
            orgId,
            error: null,
            summary: state.orgId === orgId ? state.summary : null,
        }))
        try {
            const res = await fetch(`/api/orgs/${orgId}/moods`)
            if (!res.ok) throw new Error("Could not load mood summary")
            const summary: Summary = await res.json()
            if (get().orgId === orgId) set({ summary })
        } catch {
            if (get().orgId === orgId) set({ error: "Could not load mood summary" })
        }
    },

    addMood: async ({ orgId, ...entry }) => {
        const res = await fetch(`/api/orgs/${orgId}/moods/owner`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
        })
        if (res.status === 409) {
            if (get().orgId === orgId) await get().fetchSummary(orgId)
            return
        }
        if (!res.ok) throw new Error("Could not save your check-in. Please try again.")
        set((state) => state.orgId === orgId && state.summary
            ? { summary: { ...state.summary, checkedInToday: true } }
            : state)
        if (get().orgId === orgId) await get().fetchSummary(orgId)
    },
}))
