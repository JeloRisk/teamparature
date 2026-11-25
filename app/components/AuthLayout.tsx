import type { ReactNode } from "react"
import Link from "next/link"
import BrandLockup from "./BrandLockup"
import MoodIcon, { type MoodName } from "./MoodIcon"

const moods: MoodName[] = ["happy", "excited", "neutral", "sad", "stressed"]

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="brand-light-surface dashboard-reference-theme public-brand min-h-svh bg-background text-foreground md:flex md:items-center md:justify-center md:bg-muted md:p-8">
            <main className="mx-auto grid w-full max-w-5xl bg-card md:min-h-[32rem] md:grid-cols-[minmax(0,0.94fr)_minmax(0,1fr)] md:overflow-hidden md:rounded-2xl md:border md:border-border">
                <div className="flex flex-col justify-between gap-10 border-b border-border px-5 py-2 text-primary md:border-b-0 md:bg-primary md:px-8 md:py-8 md:text-primary-foreground lg:px-12 lg:py-10">
                    <Link href="/" aria-label="Teamparature home" className="inline-flex min-h-11 w-fit items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:focus-visible:outline-white">
                        <BrandLockup labelClassName="text-lg md:text-xl" />
                    </Link>
                    <div className="hidden md:block">
                        <h2 className="max-w-sm text-balance text-3xl leading-tight lg:text-4xl">Give your team room to be heard.</h2>
                        <p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/90 lg:text-base">
                            Daily mood check-ins help you see what’s changing and start better conversations.
                        </p>
                        <div aria-hidden="true" className="mt-6 flex gap-2 lg:mt-8">
                            {moods.map(mood => <MoodIcon key={mood} mood={mood} variant="mobile" className="size-9 shrink-0 lg:size-11" />)}
                        </div>
                    </div>
                </div>
                <div className="flex min-w-0 items-center px-5 pt-8 pb-10 md:px-8 md:py-10 lg:px-12">
                    <div className="mx-auto w-full max-w-sm">{children}</div>
                </div>
            </main>
        </div>
    )
}
