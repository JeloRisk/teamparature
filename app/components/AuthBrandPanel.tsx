import Link from "next/link"
import BrandLockup from "./BrandLockup"
import MoodIcon, { type MoodName } from "./MoodIcon"

const moods: MoodName[] = ["happy", "excited", "neutral", "sad", "stressed"]

export default function AuthBrandPanel() {
    return (
        <aside className="flex w-full flex-col justify-between gap-12 bg-muted px-8 py-8 xl:px-12 xl:py-10">
            <Link href="/" aria-label="Teamparature home" className="w-fit rounded-lg text-primary focus-visible:outline-2 focus-visible:outline-ring">
                <BrandLockup />
            </Link>
            <div>
                <h2 className="max-w-sm text-3xl leading-tight xl:text-4xl">
                    Make space for your team to be heard.
                </h2>
                <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
                    A simple daily check-in helps you understand how your team feels and start more thoughtful conversations.
                </p>
                <div aria-hidden="true" className="mt-7 flex flex-wrap items-center gap-2">
                    {moods.map(mood => <MoodIcon key={mood} mood={mood} variant="mobile" className="size-10" />)}
                </div>
            </div>
        </aside>
    )
}
