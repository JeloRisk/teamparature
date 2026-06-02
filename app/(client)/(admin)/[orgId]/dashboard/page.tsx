// app/(client)/(admin)/[orgId]/dashboard/page.tsx
"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import MoodCheckInForm from "./MoodCheckInForm"
import MyMoodDashboard from "./MyMoodDashboard"

export default function DashboardParentPage() {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    
    // Core analytics unified data pipeline state
    const [analyticsData, setAnalyticsData] = useState<any>({
        overview: { dominantMood: "happy", emotionalScore: 82, streak: 4, stability: 90 },
        weeklyTrend: [
            { day: "Mon", mood: "happy", rank: 4 },
            { day: "Tue", mood: "neutral", rank: 3 },
        ],
        recentCheckIns: [],
        moodBreakdown: { happy: 1, neutral: 1, excited: 0, sad: 0, stressed: 0 },
        weeklyStats: { bestDay: "Friday" }
    })

    const handleMoodSubmit = async (newEntry: { mood: string; rank: number; note: string }) => {
        // Optimistic state calculation to instantly pipe data straight to your Recharts instances
        setAnalyticsData((prev: any) => {
            const updatedRecent = [
                { mood: newEntry.mood, rank: newEntry.rank, note: newEntry.note },
                ...(prev.recentCheckIns || [])
            ]
            
            // Increment the breakdown tally matching the submission key safely
            const updatedBreakdown = { ...(prev.moodBreakdown || {}) }
            if (newEntry.mood in updatedBreakdown) {
                updatedBreakdown[newEntry.mood] = (updatedBreakdown[newEntry.mood] || 0) + 1
            }

            return {
                ...prev,
                recentCheckIns: updatedRecent,
                moodBreakdown: updatedBreakdown
            }
        })
        
        // Tada! Close the modal cleanly after submission state transitions
        setIsModalOpen(false)
    }

    return (
        <div className="py-6 space-y-6 bg-neutral-50/30 min-h-screen relative font-[family-name:var(--font-plus-jakarta)] select-none">
            
            {/* FLOATING HEADER OR CONTROL BAR */}
            <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-neutral-800 tracking-tight">Workspace Pulse</h1>
                    <p className="text-xs text-neutral-400">Track and view your cognitive baseline.</p>
                </div>
                
                {/* THE TRIGGER BUTTON */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide py-3 px-5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-95 shadow-sm shadow-neutral-950/10"
                >
                    <Plus className="h-4 w-4" />
                    Check In Vibe
                </button>
            </div>

            <hr className="border-neutral-100 max-w-5xl mx-auto" />
            
            {/* THE MAIN ANALYTICS DASHBOARD */}
            <MyMoodDashboard prepopulatedAnalytics={analyticsData} />

            {/* --- THE MODAL OVERLAY ARCHITECTURE --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop blurred mask */}
                    <div 
                        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity duration-200 ease-out animate-in fade-in"
                        onClick={() => setIsModalOpen(false)} 
                    />
                    
                    {/* Modal Content Window */}
                    <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-neutral-100/50 overflow-hidden z-10 transform transition-all duration-200 ease-out animate-in fade-in zoom-in-95">
                        
                        {/* Smooth absolute close indicator button */}
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors duration-150 text-xs font-medium cursor-pointer z-20"
                        >
                            ✕
                        </button>

                        {/* Embed Form Wrapper */}
                        <div className="p-1">
                            <MoodCheckInForm onSubmit={handleMoodSubmit} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}