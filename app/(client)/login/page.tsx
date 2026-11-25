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
            <h1 className="public-display text-3xl leading-tight sm:text-4xl">Welcome back.</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to your Teamparature workspace.</p>

            {status !== "unauthenticated" ? (
                <div role="status" aria-label={status === "loading" ? "Checking your session" : "Opening your dashboard"} className="mt-6 space-y-5">
                    <Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" />
                </div>
            ) : (
                <form onSubmit={handleLogin} aria-busy={loading} className="mt-6 space-y-2">
                    <fieldset disabled={loading} className="min-w-0 space-y-5">
                        <div className="grid gap-1.5">
                            <label htmlFor="login-email" className="text-sm font-medium">Email address</label>
                            <Input id="login-email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)}
                                placeholder="you@example.com" className="h-12 rounded-xl bg-card text-base shadow-none focus-visible:border-primary focus-visible:ring-primary/20 sm:text-sm" />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="login-password" className="text-sm font-medium">Password</label>
                            <AuthPasswordInput id="login-password" value={password} onChange={event => setPassword(event.target.value)} disabled={loading} autoComplete="current-password" />
                        </div>
                    </fieldset>
                    <div className="flex justify-end"><Link href="/forgot-password" className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Forgot password?</Link></div>
                    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl font-semibold shadow-none">
                        {loading ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Signing in…</> : <>Sign in <ArrowRight className="size-4" aria-hidden="true" /></>}
                    </Button>
                </form>
            )}
            <div className="mt-5 border-t border-border pt-2 text-center">
                <p className="text-sm text-muted-foreground">New to Teamparature? <Link href="/register" className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Create an account</Link></p>
            </div>
        </AuthLayout>
    )
}
