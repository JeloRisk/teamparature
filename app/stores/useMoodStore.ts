"use client"

import { create } from "zustand"
import axios from "axios"

export type MoodType = "happy" | "neutral" | "sad" | "stressed" | "excited"

export interface Mood {
    _id: string
    user: string
    organization: string
    team?: string
    mood: MoodType
    rank: number
    note?: string
    date: string
    userSnapshot: {
        name: string
        email: string
    }
}

interface MoodState {
    moods: Mood[]
    loading: boolean
    error: string | null

    fetchMoods: (orgId: string) => Promise<void>
    createMood: (orgId: string, mood: Omit<Mood, "_id" | "date" | "userSnapshot">) => Promise<void>

    hasTrackedToday: (userId: string) => boolean
    moodCountToday: (userId: string) => number
}

export const useMoodStore = create<MoodState>((set, get) => ({
    moods: [],
    loading: false,
    error: null,

    fetchMoods: async (orgId) => {
        set({ loading: true, error: null })
        try {
            const res = await axios.get(`/api/orgs/${orgId}/moods`)
            set({ moods: res.data, loading: false })
        } catch (err: any) {
            set({ error: err.message, loading: false })
        }
    },

    createMood: async (orgId, moodData) => {
        set({ loading: true, error: null })
        try {
            const res = await axios.post(`/api/orgs/${orgId}/moods`, moodData)
            set({ moods: [...get().moods, res.data], loading: false })
        } catch (err: any) {
            set({ error: err.message, loading: false })
        }
    },

    hasTrackedToday: (userId) => {
        const today = new Date().toDateString()
        return get().moods.some(
            (m) => m.user === userId && new Date(m.date).toDateString() === today
        )
    },

    moodCountToday: (userId) => {
        const today = new Date().toDateString()
        return get().moods.filter(
            (m) => m.user === userId && new Date(m.date).toDateString() === today
        ).length
    },
}))
