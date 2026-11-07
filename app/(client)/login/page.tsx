"use client"

import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import AuthLayout from "@/app/components/AuthLayout"
import AuthPasswordInput from "@/app/components/AuthPasswordInput"
import { Input } from "@/app/components/ui/input"

export default function LoginPage() {
    const router = useRouter()
    const { status } = useSession()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (status === "authenticated") router.replace("/dashboard")
    }, [status, router])

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (loading) return
        setLoading(true)
        setError("")
        try {
            const result = await signIn("credentials", { email: email.trim(), password, redirect: false })
            if (result?.ok && !result.error) {
                router.replace("/dashboard")
            } else {
                setError(result?.error === "CredentialsSignin" ? "Invalid email or password." : "Could not sign in. Please try again.")
            }
        } catch {
            setError("Could not connect. Check your connection and try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back.</h1>

            {status !== "unauthenticated" ? (
                <div role="status" aria-label={status === "loading" ? "Checking your session" : "Opening your dashboard"} className="mt-8 space-y-5">
                    <Skeleton className="h-11 w-full rounded-xl" /><Skeleton className="h-11 w-full rounded-xl" /><Skeleton className="h-11 w-full rounded-xl" />
                </div>
            ) : (
                <form onSubmit={handleLogin} className="mt-8 space-y-5">
                    <fieldset disabled={loading} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="login-email" className="text-xs font-semibold text-[#4b5578]">Email address</label>
                            <Input id="login-email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)}
                                placeholder="you@example.com" className="h-11 rounded-xl border-[#e0e5f1] bg-[#fcfcfe] text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/15" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="login-password" className="text-xs font-semibold text-[#4b5578]">Password</label>
                            <AuthPasswordInput id="login-password" value={password} onChange={event => setPassword(event.target.value)} disabled={loading} autoComplete="current-password" />
                        </div>
                    </fieldset>
                    <div className="text-right"><Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link></div>
                    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-[#5474ff] font-medium text-white shadow-sm hover:bg-[#4565ec]">
                        {loading ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Signing in…</> : <>Sign in<ArrowRight className="size-4" aria-hidden="true" /></>}
                    </Button>
                </form>
            )}
            <div className="mt-7 border-t border-[#edf0f7] pt-6 text-center">
                <p className="text-xs text-slate-500">New to Teamparature? <Link href="/register" className="ml-1 font-semibold text-primary hover:underline">Create an account</Link></p>
            </div>
        </AuthLayout>
    )
}
