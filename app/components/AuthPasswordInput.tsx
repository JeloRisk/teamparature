"use client"

import { useState, type ChangeEventHandler } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "./ui/input"

export default function AuthPasswordInput({ id, value, onChange, disabled, autoComplete }: {
    id: string; value: string; onChange: ChangeEventHandler<HTMLInputElement>; disabled?: boolean; autoComplete: "new-password" | "current-password"
}) {
    const [visible, setVisible] = useState(false)
    const Icon = visible ? EyeOff : Eye
    return <div className="relative">
        <Input id={id} name="password" type={visible ? "text" : "password"} required autoComplete={autoComplete}
            value={value} onChange={onChange} disabled={disabled} placeholder={autoComplete === "new-password" ? "Create a password" : "Enter your password"}
            className="h-11 rounded-xl border-[#e0e5f1] bg-[#fcfcfe] pr-11 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/15" />
        <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} disabled={disabled}
            onClick={() => setVisible(value => !value)} className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
            <Icon className="size-4" aria-hidden="true" />
        </button>
    </div>
}
