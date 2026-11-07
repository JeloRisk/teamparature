import { useId } from "react"

export type MoodName = "happy" | "neutral" | "sad" | "stressed" | "excited"

const colors: Record<MoodName, [string, string]> = {
    happy: ["#fff0bc", "#efc76d"],
    neutral: ["#f0f1f4", "#cbd0da"],
    sad: ["#dce5ff", "#9db5f6"],
    stressed: ["#ffe3da", "#edb5a5"],
    excited: ["#ffe3f0", "#e6abc9"],
}

export default function MoodIcon({ mood, className = "size-10" }: { mood: MoodName; className?: string }) {
    const id = useId()
    const [light, dark] = colors[mood]
    return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true" focusable="false">
            <defs>
                <radialGradient id={id} cx="0.35" cy="0.25" r="0.9">
                    <stop stopColor={light} /><stop offset="1" stopColor={dark} />
                </radialGradient>
            </defs>
            <circle cx="32" cy="33" r="25" fill={`url(#${id})`} />
            <ellipse cx="23" cy="15" rx="11" ry="4" fill="white" opacity=".2" transform="rotate(-20 23 15)" />
            {(mood === "happy" || mood === "excited") && <>
                <ellipse cx="17" cy="38" rx="4" ry="2.7" fill="#db8993" opacity=".5" />
                <ellipse cx="47" cy="38" rx="4" ry="2.7" fill="#db8993" opacity=".5" />
            </>}
            {mood === "stressed" ? (
                <g stroke="#624341" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 25 7 5-7 4m26-9-7 5 7 4" />
                    <path d="M22 43q5-8 10-3t10 0" />
                    <path d="m17 18 7 4m23-4-7 4" strokeWidth="2" />
                </g>
            ) : mood === "sad" ? (
                <g stroke="#405584" strokeWidth="3" strokeLinecap="round">
                    <path d="m20 24 6-3m12 0 6 3" strokeWidth="2" />
                    <ellipse cx="24" cy="30" rx="2.2" ry="3" fill="#405584" stroke="none" />
                    <ellipse cx="40" cy="30" rx="2.2" ry="3" fill="#405584" stroke="none" />
                    <path d="M24 44q8-9 16 0" />
                </g>
            ) : (
                <g stroke="#454052" strokeWidth="3" strokeLinecap="round">
                    <ellipse cx="24" cy="29" rx="2.2" ry="3" fill="#454052" stroke="none" />
                    <ellipse cx="40" cy="29" rx="2.2" ry="3" fill="#454052" stroke="none" />
                    {mood === "neutral" ? <path d="M26 41h12" /> : <path d="M24 39q8 10 16 0" />}
                </g>
            )}
            {mood === "happy" && <circle cx="49" cy="33" r="2.3" fill="#e39c5b" />}
            {mood === "excited" && <g fill="#bc6494">
                <path d="m49 8 1.8 4.5L55 14l-4.2 1.8L49 20l-1.6-4.2L43 14l4.4-1.5Z" />
                <path d="m57 22 1 2.4 2.5 1-2.5 1-1 2.6-1-2.6-2.5-1 2.5-1Z" />
                <circle cx="42" cy="10" r="1.5" />
            </g>}
        </svg>
    )
}
