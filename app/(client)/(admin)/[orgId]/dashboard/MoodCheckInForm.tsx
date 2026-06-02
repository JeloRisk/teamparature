"use client"

import { useState } from "react"
import { Smile, Sparkles, Meh, Frown, Flame, Send } from "lucide-react"

const moodOptions = [
    { key: "happy", label: "Happy", icon: Smile, color: "text-[#00a95c] bg-[#00d26a]/10 border-[#00d26a]/20 active:bg-[#00d26a]/20" },
    { key: "excited", label: "Excited", icon: Sparkles, color: "text-[#ff2d8d] bg-[#ff2d8d]/10 border-[#ff2d8d]/20 active:bg-[#ff2d8d]/20" },
    { key: "neutral", label: "Neutral", icon: Meh, color: "text-[#00b8ff] bg-[#00c2ff]/10 border-[#00c2ff]/20 active:bg-[#00c2ff]/20" },
    { key: "sad", label: "Sad", icon: Frown, color: "text-[#7a5cff] bg-[#7a5cff]/10 border-[#7a5cff]/20 active:bg-[#7a5cff]/20" },
    { key: "stressed", label: "Stressed", icon: Flame, color: "text-[#ff9500] bg-[#ffb800]/10 border-[#ffb800]/20 active:bg-[#ffb800]/20" },
]

interface MoodCheckInFormProps {
    onSubmit: (data: { mood: string; rank: number; note: string }) => Promise<void> | void
}

export default function MoodCheckInForm({ onSubmit }: MoodCheckInFormProps) {
    const [selectedMood, setSelectedMood] = useState<string>("happy")
    const [rank, setRank] = useState<number>(3)
    const [note, setNote] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await onSubmit({ mood: selectedMood, rank, note: note.trim() })
            setNote("") // Clear note on success
        } catch (error) {
            console.error("Submission failed:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto bg-white border border-neutral-100 rounded-[32px] p-6 sm:p-8 shadow-2xs font-[family-name:var(--font-plus-jakarta)]">
            <div className="space-y-1 mb-6">
                <h2 className="text-xl font-bold text-neutral-800 tracking-tight">How are you feeling right now?</h2>
                <p className="text-xs text-neutral-400">Log your current state to update your weekly metrics.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* MOOD GRID SELECTOR */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Select Vibe</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {moodOptions.map((option) => {
                            const Icon = option.icon
                            const isSelected = selectedMood === option.key
                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setSelectedMood(option.key)}
                                    className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                                        isSelected 
                                            ? `${option.color} font-bold scale-[1.02] shadow-xs` 
                                            : "border-neutral-100 bg-neutral-50/50 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-200"
                                    }`}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <span className="text-xs tracking-tight">{option.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* INTENSITY SLIDER */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Intensity Level</label>
                        <span className="text-xs font-bold text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                            Level {rank}/5
                        </span>
                    </div>
                    <div className="relative pt-1">
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={rank}
                            onChange={(e) => setRank(Number(e.target.value))}
                            className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-[#ff6a00]"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-400 font-medium px-1 mt-1">
                            <span>Mild</span>
                            <span>Moderate</span>
                            <span>Intense</span>
                        </div>
                    </div>
                </div>

                {/* CONTEXT NOTE */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Add Context (Optional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What's making you feel this way? Leave a quick reflection..."
                        maxLength={200}
                        rows={3}
                        className="w-full text-xs p-3.5 bg-neutral-50/50 border border-neutral-100 rounded-2xl placeholder-neutral-400 focus:outline-hidden focus:border-neutral-200 focus:bg-white resize-none transition-colors duration-200 leading-relaxed text-neutral-700"
                    />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide py-3.5 px-4 rounded-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-neutral-950/10"
                >
                    <Send className="h-3.5 w-3.5" />
                    {isSubmitting ? "Logging Vibe..." : "Check In Entry"}
                </button>
            </form>
        </div>
    )
}