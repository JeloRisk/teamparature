import type { ReactNode } from "react"
import Link from "next/link"
import AuthBrandPanel from "./AuthBrandPanel"
import BrandLockup from "./BrandLockup"

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main className="brand-light-surface dashboard-reference-theme flex min-h-svh items-center justify-center bg-background px-3 py-4 text-foreground sm:px-7 sm:py-7">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2">
                <section className="flex min-w-0 flex-col lg:order-2">
                    <header className="flex items-center px-6 pt-7 sm:px-10 lg:hidden">
                        <Link href="/" aria-label="Teamparature home" className="rounded-lg text-primary focus-visible:outline-2 focus-visible:outline-ring">
                            <BrandLockup />
                        </Link>
                    </header>
                    <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12 sm:py-12">
                        <div className="w-full max-w-sm">{children}</div>
                    </div>
                </section>
                <div className="hidden border-r border-border lg:order-1 lg:flex"><AuthBrandPanel /></div>
            </div>
        </main>
    )
}
