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
            className="h-12 rounded-xl bg-card pr-12 text-base shadow-none focus-visible:border-primary focus-visible:ring-primary/20 sm:text-sm" />
        <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} disabled={disabled}
            onClick={() => setVisible(value => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring">
            <Icon className="size-4" aria-hidden="true" />
        </button>
    </div>
}
