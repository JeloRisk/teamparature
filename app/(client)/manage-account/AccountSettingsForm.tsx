"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LoaderCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { useUserStore } from "@/app/stores/useUserStore"

const inputClass = "h-11 rounded-xl border-border bg-card shadow-none focus-visible:border-primary focus-visible:ring-primary/15"

export default function AccountSettingsForm({ initial, returnHref }: { initial: { firstName: string; lastName: string; email: string; birthday: string }; returnHref?: string }) {
    const router = useRouter()
    const setUser = useUserStore(state => state.setUser)
    const [form, setForm] = useState({ firstName: initial.firstName, lastName: initial.lastName, birthday: initial.birthday })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [saved, setSaved] = useState(false)

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (saving) return
        setSaving(true)
        setError("")
        setSaved(false)
        try {
            const response = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Could not save your profile.")
            setUser({
                _id: data._id,
                id: data._id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                birthday: data.birthday,
                avatar: data.avatar ?? "",
            })
            setSaved(true)
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not save your profile. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return <>
        <Button type="button" variant="ghost" onClick={() => returnHref ? router.push(returnHref) : router.back()} className="mt-5 -ml-3 h-11 px-3 text-muted-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </Button>
        <form onSubmit={submit} className="mt-2 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="account-first-name" className="text-sm font-medium">First name</label>
                    <Input id="account-first-name" name="firstName" autoComplete="given-name" required maxLength={80} value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="account-last-name" className="text-sm font-medium">Last name</label>
                    <Input id="account-last-name" name="lastName" autoComplete="family-name" required maxLength={80} value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })} className={inputClass} />
                </div>
            </div>
            <div className="space-y-2">
                <label htmlFor="account-email" className="text-sm font-medium">Email address</label>
                <Input id="account-email" name="email" type="email" autoComplete="email" readOnly value={initial.email} className={`${inputClass} text-muted-foreground`} />
            </div>
            <div className="space-y-2">
                <label htmlFor="account-birthday" className="text-sm font-medium">Birthday <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input id="account-birthday" name="birthday" type="date" autoComplete="bday" value={form.birthday} onChange={event => setForm({ ...form, birthday: event.target.value })} className={inputClass} />
            </div>
            {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            {saved && <p role="status" className="text-sm font-medium text-primary">Profile saved.</p>}
            <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl">
                {saving ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Saving…</> : "Save changes"}
            </Button>
        </form>
    </>
}
