// types/moods.ts
export interface Mood {
    _id: string;
    mood: "happy" | "neutral" | "sad" | "stressed" | "excited";
    rank: number;
    note?: string;
    date: string;
    user: string;
    organization: string;
}
