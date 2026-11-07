import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import AuthBrandPanel from "./AuthBrandPanel"

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#eff6ff] px-3 py-4 text-[#262d50] sm:px-7 sm:py-7">
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-24 top-0 size-[420px] rounded-full bg-blue-200/45 blur-3xl" />
                <div className="absolute -bottom-32 -right-20 size-[420px] rounded-full bg-orange-200/30 blur-3xl" />
                <span className="auth-ambient absolute left-[6%] top-[5%] text-3xl opacity-60">❄️</span>
                <span className="auth-ambient absolute right-[12%] top-[3%] text-3xl opacity-60 [animation-delay:-3s]">🔥</span>
                <span className="auth-ambient absolute left-[1%] top-[48%] text-2xl opacity-50 [animation-delay:-5s]">🔥</span>
                <span className="auth-ambient absolute right-[1%] top-[38%] text-3xl opacity-50 [animation-delay:-2s]">❄️</span>
                <span className="auth-ambient absolute bottom-[3%] left-[14%] text-3xl opacity-60 [animation-delay:-4s]">🔥</span>
                <span className="auth-ambient absolute bottom-[4%] right-[8%] text-3xl opacity-60 [animation-delay:-6s]">❄️</span>
            </div>
            <div className="relative w-full max-w-7xl rounded-[28px] border border-white/90 bg-white/50 p-2 shadow-[0_20px_80px_-40px_rgba(40,52,100,0.25)]">
                <div className="grid overflow-hidden rounded-[22px] bg-white lg:grid-cols-2">
                    <section className="flex flex-col lg:order-2">
                        <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-7 sm:px-10">
                            <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
                                <Image src="/logo.png" alt="" width={32} height={32} />
                                <span className="text-lg font-semibold tracking-tight text-[#5474ff]">Teamparature</span>
                            </Link>
                            <Link href="/" className="flex items-center gap-1 rounded-lg px-1 py-2 text-xs text-slate-400 hover:text-primary"><ArrowLeft className="size-3" />Home</Link>
                        </header>
                        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12 sm:py-12">
                            <div className="w-full max-w-sm">{children}</div>
                        </div>
                        <footer className="px-6 pb-6 text-xs text-slate-400 sm:px-10">A little check-in. A more connected team.</footer>
                    </section>
                    <div className="hidden p-4 pr-0 lg:order-1 lg:flex"><AuthBrandPanel /></div>
                </div>
            </div>
        </main>
    )
}
