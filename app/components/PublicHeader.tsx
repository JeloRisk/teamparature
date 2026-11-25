import type { ReactNode } from "react"
import Link from "next/link"
import BrandLockup from "./BrandLockup"

export default function PublicHeader({ children }: { children?: ReactNode }) {
    return (
        <header className="border-b border-border text-primary">
            <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:min-h-16 sm:px-8">
                <Link href="/" aria-label="Teamparature home" className="inline-flex min-h-11 min-w-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    <BrandLockup labelClassName="text-lg sm:text-xl" />
                </Link>
                {children}
            </div>
        </header>
    )
}
