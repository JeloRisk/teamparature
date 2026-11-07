"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react"
import AuthLayout from "@/app/components/AuthLayout"
import AuthPasswordInput from "@/app/components/AuthPasswordInput"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"

const inputClass = "h-11 rounded-xl border-[#e0e5f1] bg-[#fcfcfe] text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/15"

export default function RegisterPage() {
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", birthday: "" })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return
        setLoading(true)
        setError("")
        setMessage("")
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Could not create your account.")
            setMessage(data.message || "Account created. Check your email for the next step.")
            setForm({ firstName: "", lastName: "", email: "", password: "", birthday: "" })
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not connect. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return <AuthLayout>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Start something good.</h1>

        {message ? <div role="status" className="mt-8 rounded-2xl border border-[#dfe6f8] bg-[#f4f6ff] p-5">
            <CheckCircle2 className="mb-3 size-7 text-primary" aria-hidden="true" /><h2 className="font-semibold">You’re one step closer.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            <Button asChild className="mt-5 h-11 w-full rounded-xl"><Link href="/login">Continue to sign in<ArrowRight className="size-4" /></Link></Button>
        </div> : <form onSubmit={submit} className="mt-7 space-y-4">
            <fieldset disabled={loading} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2"><label htmlFor="register-first-name" className="text-xs font-semibold text-[#4b5578]">First name</label><Input id="register-first-name" name="firstName" autoComplete="given-name" required value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })} placeholder="First name" className={inputClass} /></div>
                    <div className="space-y-2"><label htmlFor="register-last-name" className="text-xs font-semibold text-[#4b5578]">Last name</label><Input id="register-last-name" name="lastName" autoComplete="family-name" required value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })} placeholder="Last name" className={inputClass} /></div>
                </div>
                <div className="space-y-2"><label htmlFor="register-email" className="text-xs font-semibold text-[#4b5578]">Email address</label><Input id="register-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" className={inputClass} /></div>
                <div className="space-y-2"><label htmlFor="register-password" className="text-xs font-semibold text-[#4b5578]">Password</label><AuthPasswordInput id="register-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} disabled={loading} autoComplete="new-password" /></div>
                <div className="space-y-2"><label htmlFor="register-birthday" className="text-xs font-semibold text-[#4b5578]">Birthday <span className="font-normal text-slate-400">(optional)</span></label><Input id="register-birthday" name="birthday" type="date" autoComplete="bday" value={form.birthday} onChange={event => setForm({ ...form, birthday: event.target.value })} className={inputClass} /></div>
            </fieldset>
            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-[#5474ff] font-medium text-white shadow-sm hover:bg-[#4565ec]">
                {loading ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Creating your account…</> : <>Create account<ArrowRight className="size-4" aria-hidden="true" /></>}
            </Button>
        </form>}
        <div className="mt-6 border-t border-[#edf0f7] pt-5 text-center">
            <p className="text-xs text-slate-500">Already part of a team? <Link href="/login" className="ml-1 font-semibold text-primary hover:underline">Sign in</Link></p>
        </div>
    </AuthLayout>
}
